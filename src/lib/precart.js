// Önden seçim: kayıt açılmadan önce hazırlanan sıralı ders sepeti ve kayıt anında otomatik işlenmesi.
//
// Sepet = öncelik sırasına dizilmiş dersler. Her dersin:
//   sections: tercih edilen şubeler, sırasıyla (boşsa "herhangi bir şube")
//   backups:  ana ders alınamazsa sırayla denenecek yedek dersler
//
// Kayıt açıldığında dersler sırayla işlenir: ana dersin tercih edilen şubeleri,
// olmazsa yedekler denenir. Her deneme nedeniyle birlikte günlüğe yazılır.

import { COURSES, CURRICULA, ELECTIVE_GROUPS, SPRING_SECTIONS, findSection } from '../data/catalog.js'
import { findConflicts } from './schedule.js'
import { latestByCode } from './progress.js'
import { isPassed, FAILING } from './grades.js'
import { ectsLimits, overlapAllowed } from './rules.js'

const SRC = SPRING_SECTIONS

function inProgress(student) {
  return new Set(student.registration.selection.map((s) => s.code))
}

function passed(student, code) {
  const r = latestByCode(student).get(code)
  return Boolean(r && isPassed(r.letter))
}

// Öğrencinin bir sonraki dönem müfredatından otomatik önerilen başlangıç sepeti
export function defaultCart(student) {
  const cur = CURRICULA[student.dept]
  const next = cur.semesters[student.semester] || []
  const taking = inProgress(student)
  const used = new Set()
  const items = []
  const add = (code, backups = []) => {
    if (!SRC[code] || used.has(code)) return
    used.add(code)
    backups.forEach((b) => used.add(b))
    items.push({ code, sections: [], backups: backups.map((b) => ({ code: b, sections: [] })) })
  }

  // Önce alttan dersler: başarısız olunan ve bu dönem alınmayan zorunlu dersler
  const req = new Set(cur.semesters.flat().filter((x) => typeof x === 'string'))
  for (const r of latestByCode(student).values()) {
    if (FAILING.has(r.letter) && req.has(r.code) && !taking.has(r.code)) add(r.code)
  }

  for (const item of next) {
    if (typeof item === 'string') {
      if (!passed(student, item) && !taking.has(item)) add(item)
    } else {
      const pool = ELECTIVE_GROUPS[item.group].pool.filter((c) => SRC[c] && !passed(student, c) && !taking.has(c) && !used.has(c))
      if (pool.length) add(pool[0], pool.slice(1, 3))
    }
  }
  return { items, autoFinalize: true, notify: true, status: 'editing', result: null }
}

function sectionOrder(code, prefs) {
  const all = (SRC[code] || []).map((s) => s.no)
  return prefs && prefs.length ? prefs.filter((n) => all.includes(n)) : all
}

function nonInternshipEcts(selection) {
  return selection.reduce((s, x) => s + (x.code.endsWith('4830') ? 0 : COURSES[x.code].ects), 0)
}

function hardConflicts(selection, ignore) {
  return findConflicts(selection, SRC).filter((p) => !ignore.has(p.a) && !ignore.has(p.b))
}

function prereqState(student, code) {
  const taking = inProgress(student)
  const missing = COURSES[code].prereq.filter((p) => !passed(student, p))
  return {
    blocked: missing.filter((p) => !taking.has(p)),
    pending: missing.filter((p) => taking.has(p)),
  }
}

// Kayıt açılmadan önce: ana tercihlerle oluşacak program ve olası sorunlar
export function precheck(student, cart) {
  const ignore = overlapAllowed(student)
  const limits = ectsLimits(student)
  const primary = cart.items.map((it) => ({ code: it.code, no: sectionOrder(it.code, it.sections)[0] })).filter((x) => x.no)
  const issues = []
  const ects = nonInternshipEcts(primary)

  if (ects > limits.max) issues.push({ level: 'error', title: `Ana tercihler ${ects} AKTS ediyor, sınır ${limits.max}`, detail: 'Kayıt anında sınırı aşan sondaki dersler alınmaz. Önemli dersleri yukarı taşı.' })
  else if (ects < limits.min && primary.length) issues.push({ level: 'warning', title: `Ana tercihler ${ects} AKTS, en az ${limits.min} olmalı`, detail: 'Bir ders daha eklemeyi düşün.' })

  for (const p of hardConflicts(primary, ignore)) {
    issues.push({ level: 'error', codes: [p.a, p.b], title: `${p.a} ile ${p.b} ilk tercih şubelerinde çakışıyor (${p.label})`, detail: 'Sonraki sıradaki ders başka şubesine ya da yedeğine geçer. Şube tercihini değiştirmen daha iyi olur.' })
  }

  cart.items.forEach((it) => {
    const all = [it, ...it.backups]
    all.forEach((c, i) => {
      const label = i === 0 ? c.code : `${c.code} (${it.code} yedeği)`
      if (passed(student, c.code)) issues.push({ level: 'error', codes: [c.code], title: `${label} dersini zaten geçtin`, detail: 'Sepetten çıkar.' })
      const pr = prereqState(student, c.code)
      if (pr.blocked.length) issues.push({ level: 'error', codes: [c.code], title: `${label} için ön koşul eksik`, detail: `Önce ${pr.blocked.join(', ')} dersini geçmen gerekiyor.` })
      if (pr.pending.length) issues.push({ level: 'info', codes: [c.code], title: `${label}, bu dönemki ${pr.pending.join(', ')} notuna bağlı`, detail: 'O dersten geçemezsen kayıt anında bu ders atlanır ve yedeğe geçilir.' })
    })
    // Yedeğe düşülürse diğer ana derslerle çakışma
    it.backups.forEach((b) => {
      const others = primary.filter((x) => x.code !== it.code)
      const firstNo = sectionOrder(b.code, b.sections)[0]
      if (!firstNo) return
      const clash = hardConflicts([...others, { code: b.code, no: firstNo }], ignore).find((p) => p.a === b.code || p.b === b.code)
      if (clash) {
        const other = clash.a === b.code ? clash.b : clash.a
        issues.push({ level: 'warning', codes: [b.code], title: `Yedeğe düşersen ${b.code}, ${other} ile çakışır`, detail: `${clash.label}. Yedeğin başka bir şubesini de tercih listesine ekle.` })
      }
    })
    const isElective = Object.values(ELECTIVE_GROUPS).some((g) => g.pool.includes(it.code))
    if (isElective && !it.backups.length && (SRC[it.code] || []).length === 1) {
      issues.push({ level: 'info', codes: [it.code], title: `${it.code} tek şube açılıyor ve yedeği yok`, detail: 'Dolarsa ya da açılmazsa yerine bir şey alınmaz.' })
    }
  })

  const order = { error: 0, warning: 1, info: 2 }
  issues.sort((a, b) => order[a.level] - order[b.level])
  return { primary, ects, limits, issues, errors: issues.filter((i) => i.level === 'error').length }
}

// Kayıt anı senaryosu: demo için bilinçli olarak bir ders açılmaz, bir şube dolar.
export function openingEvents(cart) {
  const cancelled = new Set()
  const full = new Set()
  const withBackup = cart.items.find((it) => it.backups.length)
  if (withBackup) cancelled.add(withBackup.code)
  const twoSections = cart.items.find((it) => !cancelled.has(it.code) && (SRC[it.code] || []).length > 1)
  if (twoSections) full.add(`${twoSections.code}#${sectionOrder(twoSections.code, twoSections.sections)[0]}`)
  return { cancelled, full }
}

// Yeni ders hiçbir şubesiyle sığmıyorsa, daha önce alınmış derslerin şubelerini
// (öğrencinin tercih listesi içinde kalarak) yeniden düzenleyip yer açmayı dener.
function refit(taken, cand, options, ignore) {
  const entries = [...taken.map((t) => ({ code: t.code, options: t.options })), { code: cand, options }]
  const chosen = []
  function rec(i) {
    if (i === entries.length) return true
    for (const no of entries[i].options) {
      chosen.push({ code: entries[i].code, no })
      if (hardConflicts(chosen, ignore).length === 0 && rec(i + 1)) return true
      chosen.pop()
    }
    return false
  }
  return rec(0) ? chosen : null
}

export function simulateOpening(student, cart, now = new Date()) {
  const ignore = overlapAllowed(student)
  const limits = ectsLimits(student)
  const { cancelled, full } = openingEvents(cart)
  const taken = []
  const log = []

  for (const it of cart.items) {
    const attempts = []
    let result = null
    const candidates = [{ ...it, backup: false }, ...it.backups.map((b) => ({ ...b, backup: true }))]
    for (const cand of candidates) {
      if (cancelled.has(cand.code)) { attempts.push({ code: cand.code, reason: 'Bu dönem açılmadı' }); continue }
      if (passed(student, cand.code)) { attempts.push({ code: cand.code, reason: 'Daha önce geçilmiş' }); continue }
      const pr = prereqState(student, cand.code)
      if (pr.blocked.length) { attempts.push({ code: cand.code, reason: `Ön koşul eksik: ${pr.blocked.join(', ')}` }); continue }
      if (!cand.code.endsWith('4830') && nonInternshipEcts([...taken, { code: cand.code }]) > limits.max) {
        attempts.push({ code: cand.code, reason: `AKTS sınırı (${limits.max}) aşılırdı` }); continue
      }
      const open = []
      for (const no of sectionOrder(cand.code, cand.sections)) {
        if (full.has(`${cand.code}#${no}`)) { attempts.push({ code: cand.code, no, reason: 'Şube kayıt açılır açılmaz doldu' }); continue }
        open.push(no)
        const clash = hardConflicts([...taken, { code: cand.code, no }], ignore).find((p) => p.a === cand.code || p.b === cand.code)
        if (clash) { attempts.push({ code: cand.code, no, reason: `${clash.a === cand.code ? clash.b : clash.a} ile çakışıyor` }); continue }
        result = { code: cand.code, no, backup: cand.backup, options: open }
        break
      }
      if (!result && open.length && taken.length) {
        const fit = refit(taken, cand.code, open, ignore)
        if (fit) {
          const moved = []
          fit.slice(0, -1).forEach((f, i) => {
            if (taken[i].no !== f.no) moved.push(`${f.code} şube ${taken[i].no} → ${f.no}`)
            taken[i].no = f.no
          })
          const mine = fit[fit.length - 1]
          result = { code: cand.code, no: mine.no, backup: cand.backup, options: open, moved }
          log.forEach((l) => { const t = taken.find((x) => x.code === l.result?.code); if (l.result && t) l.result.no = t.no })
        } else {
          attempts.push({ code: cand.code, reason: 'Önceki derslerin şubeleri değiştirilerek de yer açılamadı' })
        }
      }
      if (result) break
    }
    if (result) {
      // Alınan dersin, ileride yeniden düzenlenebilecek şube seçenekleri (tercih listesi ve boş şubeler)
      const opts = sectionOrder(result.code, candidates.find((c) => c.code === result.code).sections).filter((n) => !full.has(`${result.code}#${n}`))
      taken.push({ code: result.code, no: result.no, options: opts })
    }
    log.push({ item: it.code, result, attempts })
  }

  const got = log.filter((l) => l.result)
  const viaBackup = got.filter((l) => l.result.backup).length
  const otherSection = got.filter((l) => !l.result.backup && l.attempts.some((a) => a.code === l.item && a.no)).length
  const missed = log.length - got.length
  return {
    at: now.toISOString(),
    taken: taken.map(({ code, no }) => ({ code, no })),
    log,
    ects: nonInternshipEcts(taken),
    summary: { total: log.length, got: got.length, viaBackup, otherSection, missed },
    finalized: cart.autoFinalize && taken.length > 0,
    events: { cancelled: [...cancelled], full: [...full] },
  }
}

export function notificationText(result, termLabel) {
  const s = result.summary
  const parts = [`${s.total} dersten ${s.got} tanesi alındı.`]
  if (s.viaBackup) parts.push(`${s.viaBackup} ders yedekten.`)
  if (s.otherSection) parts.push(`${s.otherSection} ders başka şubeden.`)
  if (s.missed) parts.push(`${s.missed} ders alınamadı.`)
  parts.push(`Toplam ${result.ects} AKTS.`)
  parts.push(result.finalized ? 'Kesinleştirildi, danışman onayı bekleniyor.' : 'Kesinleştirmeyi unutma.')
  return { title: `${termLabel} kaydın tamamlandı`, body: parts.join(' ') }
}

export { SRC as CART_SECTIONS, sectionOrder, findSection }
