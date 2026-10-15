// Tercihlere göre program üretici.
// Seçili derslerin tüm şube kombinasyonlarını tarar, kesin çakışmaları eler,
// kalanları öğrencinin tercihlerine göre puanlar ve en iyi birkaç programı döndürür.

import { SECTIONS, SLOTS, DAYS } from '../data/catalog.js'
import { findConflicts } from './schedule.js'

export const DEFAULT_PREFS = {
  freeDays: [], // boş kalması istenen günler (0 = Pazartesi)
  notBefore: 0, // bu slottan önce ders olmasın (0 = 08:40)
  notAfter: 13, // bu slottan sonra ders olmasın (13 = 21:40 başlayan son slot)
  fewGaps: true, // dersler arası boşluk az olsun
  fewDays: false, // dersler mümkün olduğunca az güne toplansın
}

// ---------- Yazılı tercihleri ayrıştırma ----------
const DAY_WORDS = [
  [0, ['pazartesi', 'pzt']],
  [1, ['sali', 'sal']],
  [2, ['carsamba', 'car']],
  [3, ['persembe', 'per']],
  [4, ['cuma', 'cum']],
]

function normTr(s) {
  return s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Saat (ör. 10, 10:40, 13.30) → o saatte ya da sonrasında başlayan ilk slot
function slotAtOrAfter(h, m = 0) {
  const minutes = h * 60 + m
  const idx = SLOTS.findIndex((s) => {
    const [sh, sm] = s.start.split(':').map(Number)
    return sh * 60 + sm >= minutes
  })
  return idx === -1 ? SLOTS.length : idx
}
// Saat → o saate kadar biten son slot
function slotEndingBy(h, m = 0) {
  const minutes = h * 60 + m
  let idx = -1
  SLOTS.forEach((s, i) => {
    const [eh, em] = s.end.split(':').map(Number)
    if (eh * 60 + em <= minutes) idx = i
  })
  return idx
}

const NEG = /(bos|olmasin|istemiyorum|istemem|yok|izin|tatil|haric|gelmek istemiyorum|olmayacak)/

export function parsePrefs(text, base = DEFAULT_PREFS) {
  const t = normTr(text || '')
  const prefs = { ...base, freeDays: [...base.freeDays] }
  const found = []
  if (!t.trim()) return { prefs, found }

  // Virgül ve noktaya göre böl; "ve" ile bağlanan günler aynı parçada kalır ("pazartesi ve cuma boş")
  const parts = t.split(/[,.;\n]| ama | fakat /).map((p) => p.trim()).filter(Boolean)
  for (const p of parts) {
    const neg = NEG.test(p)
    // Gün: "cuma boş olsun", "pazartesi ve cuma gelmek istemiyorum"
    if (neg) {
      for (const [d, words] of DAY_WORDS) {
        if (words.some((w) => new RegExp(`\\b${w}`).test(p)) && !prefs.freeDays.includes(d)) {
          prefs.freeDays.push(d)
          found.push(`${DAYS[d]} boş`)
        }
      }
    }
    // Saat: "10'dan önce", "16:30'dan sonra" (aynı cümlede birden fazla olabilir)
    const times = [...p.matchAll(/(\d{1,2})(?:[:.](\d{2}))?\s*'?\s*(?:den|dan|ten|tan)?\s*(once|sonra)/g)]
    for (const time of times) {
      const h = Number(time[1])
      const m = Number(time[2] || 0)
      if (time[3] === 'once') {
        prefs.notBefore = Math.min(slotAtOrAfter(h, m), SLOTS.length - 1)
        found.push(`${SLOTS[prefs.notBefore].start}'dan önce ders yok`)
      } else {
        prefs.notAfter = Math.max(0, slotEndingBy(h, m))
        found.push(`${SLOTS[prefs.notAfter].end}'dan sonra ders yok`)
      }
    }
    if (!times.some((x) => x[3] === 'once') && /(sabah|erken)/.test(p) && neg) {
      prefs.notBefore = 2 // 10:40
      found.push(`${SLOTS[2].start}'dan önce ders yok`)
    }
    if (/(ogleden sonra)/.test(p) && neg) {
      prefs.notAfter = 3 // 12:30'da biten slot
      found.push(`${SLOTS[3].end}'dan sonra ders yok`)
    }
    if (!times.some((x) => x[3] === 'sonra') && /aksam/.test(p) && neg) {
      prefs.notAfter = 8 // 17:30
      found.push(`${SLOTS[8].end}'dan sonra ders yok`)
    }
    if (/(bosluk|aralik|pencere|bekleme|arada)/.test(p)) {
      prefs.fewGaps = true
      found.push('Arada az boşluk')
    }
    if (/(az gun|sikistir|kompakt|toplu|ayni gune|daha az gun|gun sayisi)/.test(p)) {
      prefs.fewDays = true
      found.push('Az güne topla')
    }
  }
  return { prefs, found: [...new Set(found)] }
}

// ---------- Puanlama ----------
export function analyze(selection, prefs, source = SECTIONS) {
  const days = [[], [], [], [], []]
  for (const { code, no } of selection) {
    const sec = (source[code] || []).find((s) => s.no === no)
    if (!sec) continue
    sec.meetings.forEach((m) => { if (!m.online) days[m.day].push(m) })
  }
  let gapHours = 0
  let earliest = 99
  let latest = -1
  const usedDays = []
  const violations = []
  days.forEach((list, d) => {
    if (!list.length) return
    usedDays.push(d)
    const slots = new Set()
    list.forEach((m) => { for (let s = m.start; s < m.start + m.len; s++) slots.add(s) })
    const sorted = [...slots].sort((a, b) => a - b)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    earliest = Math.min(earliest, first)
    latest = Math.max(latest, last)
    gapHours += last - first + 1 - sorted.length
    if (prefs.freeDays.includes(d)) violations.push({ kind: 'day', text: `${DAYS[d]} günü ${sorted.length} saat ders var`, weight: 40 + sorted.length * 4 })
    const early = sorted.filter((s) => s < prefs.notBefore).length
    if (early) violations.push({ kind: 'early', text: `${DAYS[d]} ${SLOTS[first].start}'da başlıyor`, weight: early * 10 })
    const late = sorted.filter((s) => s > prefs.notAfter).length
    if (late) violations.push({ kind: 'late', text: `${DAYS[d]} ${SLOTS[last].end}'a kadar sürüyor`, weight: late * 10 })
  })
  // Öğrencinin açıkça söylediği tercihlerden kaçı tutuyor
  const criteria = [
    ...prefs.freeDays.map((d) => ({ label: `${DAYS[d]} boş`, ok: !usedDays.includes(d) })),
    ...(prefs.notBefore > 0 ? [{ label: `${SLOTS[prefs.notBefore].start}'dan önce ders yok`, ok: !violations.some((v) => v.kind === 'early') }] : []),
    ...(prefs.notAfter < SLOTS.length - 1 ? [{ label: `${SLOTS[prefs.notAfter].end}'dan sonra ders yok`, ok: !violations.some((v) => v.kind === 'late') }] : []),
  ]
  let score = 100
  violations.forEach((v) => { score -= v.weight })
  if (prefs.fewGaps) score -= gapHours * 3
  if (prefs.fewDays) score -= usedDays.length * 6
  else score -= Math.max(0, usedDays.length - 4) * 2
  return {
    score: Math.max(0, Math.round(score)),
    gapHours,
    usedDays,
    freeDays: [0, 1, 2, 3, 4].filter((d) => !usedDays.includes(d)),
    earliest: earliest === 99 ? null : earliest,
    latest: latest === -1 ? null : latest,
    violations,
    criteria,
  }
}

// ---------- Arama ----------
// codes: seçili dersler; current: mevcut şube seçimi (dolu olsa bile o şubede yerin var sayılır)
export function generatePlans(codes, prefs, { current = [], ignore = new Set(), source = SECTIONS, limit = 5, maxCombos = 50000 } = {}) {
  const curNo = Object.fromEntries(current.map((c) => [c.code, c.no]))
  const options = codes.map((code) => ({
    code,
    nos: (source[code] || []).filter((s) => s.enrolled < s.capacity || curNo[code] === s.no).map((s) => s.no),
  }))
  const unavailable = options.filter((o) => o.nos.length === 0).map((o) => o.code)
  const searchable = options.filter((o) => o.nos.length > 0).sort((a, b) => a.nos.length - b.nos.length)

  const plans = []
  let explored = 0
  const chosen = []
  function rec(i) {
    if (explored >= maxCombos) return
    if (i === searchable.length) {
      explored++
      const sel = chosen.map((c) => ({ ...c }))
      plans.push({ selection: sel, ...analyze(sel, prefs, source) })
      return
    }
    for (const no of searchable[i].nos) {
      chosen.push({ code: searchable[i].code, no })
      const hard = findConflicts(chosen, source).some((p) => !ignore.has(p.a) && !ignore.has(p.b))
      if (!hard) rec(i + 1)
      chosen.pop()
    }
  }
  rec(0)

  plans.sort((a, b) => b.score - a.score || a.gapHours - b.gapHours)
  // Aynı ders günlerine ve aynı puana sahip neredeyse aynı planları ele
  const seen = new Set()
  const top = []
  for (const p of plans) {
    const key = `${p.score}|${p.usedDays.join('')}|${p.gapHours}`
    if (seen.has(key)) continue
    seen.add(key)
    const changes = p.selection.filter((s) => curNo[s.code] !== undefined && curNo[s.code] !== s.no)
    top.push({ ...p, changes })
    if (top.length >= limit) break
  }
  // İmkânsız gün tercihleri: her açık şubesi o gün kampüste olan dersler
  const blockers = prefs.freeDays.map((d) => ({
    day: d,
    codes: searchable.filter((o) => o.nos.every((no) => (source[o.code].find((s) => s.no === no)?.meetings || []).some((m) => m.day === d && !m.online))).map((o) => o.code),
  })).filter((b) => b.codes.length)
  return { plans: top, total: plans.length, unavailable, blockers, capped: explored >= maxCombos }
}
