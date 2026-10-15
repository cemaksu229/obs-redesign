// Ders kayıt kuralları (Yaşar Üniversitesi ÖİM ders kayıt rehberine göre sadeleştirilmiş).
import { COURSES, CURRICULA, ELECTIVE_GROUPS, SECTIONS, findSection, courseYear } from '../data/catalog.js'
import { findConflicts } from './schedule.js'
import { latestByCode, standing } from './progress.js'
import { isPassed, LOW_PASS, FAILING } from './grades.js'

export function classYear(student) {
  return Math.ceil(student.semester / 2)
}

export function ectsLimits(student) {
  const st = standing(student)
  const cur = CURRICULA[student.dept]
  const lastSemester = student.semester >= cur.semesters.length
  if (student.semester <= 2) return { min: lastSemester ? 0 : 20, max: 30, reason: 'İlk iki yarıyılda en fazla 30 AKTS' }
  if (st.probation) return { min: 20, max: 32, reason: 'AGNO 2,00\'ın altında olduğu için en fazla 32 AKTS' }
  return { min: lastSemester ? 0 : 20, max: 40, reason: 'Dönem başına 20–40 AKTS' }
}

function curriculumCodes(student) {
  const cur = CURRICULA[student.dept]
  const out = new Set()
  cur.semesters.forEach((sem) => sem.forEach((item) => {
    if (typeof item === 'string') out.add(item)
    else ELECTIVE_GROUPS[item.group].pool.forEach((c) => out.add(c))
  }))
  return out
}

export function selectionEcts(selection) {
  // Staj dersleri AKTS limitine dahil edilmez
  return selection.reduce((s, x) => s + (x.code.endsWith('4830') ? 0 : COURSES[x.code].ects), 0)
}

// F ile kalınan dersler başka derslerle çakışabilir (devam zorunluluğu yok)
export function overlapAllowed(student) {
  return new Set([...latestByCode(student).values()].filter((r) => r.letter === 'F').map((r) => r.code))
}

// Öğrencinin alması gereken alttan (başarısız zorunlu) dersler
export function mustRetake(student) {
  const latest = latestByCode(student)
  const req = new Set(CURRICULA[student.dept].semesters.flat().filter((x) => typeof x === 'string'))
  return [...latest.values()].filter((r) => FAILING.has(r.letter) && req.has(r.code) && SECTIONS[r.code]).map((r) => r.code)
}

export function validate(student, selection) {
  const issues = []
  const latest = latestByCode(student)
  const st = standing(student)
  const limits = ectsLimits(student)
  const ects = selectionEcts(selection)
  const year = classYear(student)
  const curCodes = curriculumCodes(student)

  // AKTS sınırı
  if (ects > limits.max) {
    issues.push({ level: 'error', title: `AKTS sınırını ${ects - limits.max} aşıyorsun`, detail: `${limits.reason}. Bir dersi çıkar.` })
  } else if (ects < limits.min && selection.length > 0) {
    issues.push({ level: 'warning', title: `En az ${limits.min} AKTS almalısın`, detail: `Şu an ${ects} AKTS seçili. Son dönemde değilsen alt sınır geçerli.` })
  }

  // Çakışmalar
  for (const p of findConflicts(selection)) {
    const fa = latest.get(p.a)?.letter === 'F'
    const fb = latest.get(p.b)?.letter === 'F'
    if (fa || fb) {
      const failed = fa ? p.a : p.b
      issues.push({ level: 'warning', codes: [p.a, p.b], title: `${p.a} ile ${p.b} çakışıyor (${p.label})`, detail: `${failed} dersinden F ile kaldığın için bu çakışmaya izin var. Devam zorunluluğun yok ama tüm sınav ve ödevlere girmelisin.` })
    } else {
      issues.push({ level: 'error', codes: [p.a, p.b], title: `${p.a} ile ${p.b} çakışıyor (${p.label})`, detail: 'Çakışan iki yeni dersi aynı anda alamazsın. Başka bir şube seç ya da dersi bir sonraki döneme bırak.' })
    }
  }

  for (const { code, no } of selection) {
    const course = COURSES[code]
    const sec = findSection(code, no)
    const prev = latest.get(code)

    // Kontenjan
    if (sec && sec.enrolled >= sec.capacity) {
      const alt = (SECTIONS[code] || []).find((s) => s.enrolled < s.capacity)
      issues.push({ level: 'error', codes: [code], title: `${code} şube ${no} dolu`, detail: alt ? `Şube ${alt.no}'de yer var.` : 'Diğer şubeler de dolu. Kontenjan talebi için bölüm başkanlığına başvur.' })
    }

    // Ön koşul
    const missing = course.prereq.filter((p) => !(latest.has(p) && isPassed(latest.get(p).letter)))
    if (missing.length) {
      issues.push({ level: 'error', codes: [code], title: `${code} için ön koşul eksik`, detail: `Önce ${missing.join(', ')} dersini geçmen gerekiyor.` })
    }

    // Daha önce alınmış
    if (prev && isPassed(prev.letter)) {
      if (LOW_PASS.has(prev.letter)) {
        issues.push({ level: 'info', codes: [code], title: `${code} tekrarı`, detail: `${prev.letter} ile geçmiştin. Kontenjan varsa notunu yükseltmek için tekrar alabilirsin; yeni not geçerli olur.` })
      } else {
        issues.push({ level: 'error', codes: [code], title: `${code} dersini zaten geçtin`, detail: `${prev.term} döneminde ${prev.letter} aldın.` })
      }
    }

    // Sınamalı öğrenci üst sınıf dersi alamaz
    if (st.probation && courseYear(code) > year) {
      issues.push({ level: 'error', codes: [code], title: `${code} üst sınıf dersi`, detail: 'Sınamalı öğrenciler kendi sınıfının üstündeki dersleri alamaz.' })
    }

    // Müfredat dışı
    if (!curCodes.has(code)) {
      issues.push({ level: 'warning', codes: [code], title: `${code} müfredatında yok`, detail: 'Bu ders mezuniyet kredine sayılmayabilir. Danışmanına sor.' })
    }
  }

  // Alttan dersler
  const selected = new Set(selection.map((s) => s.code))
  for (const code of mustRetake(student)) {
    if (!selected.has(code)) {
      issues.push({ level: 'error', codes: [code], title: `${code} alttan dersini seçmedin`, detail: 'Başarısız olduğun zorunlu dersi açıldığı ilk dönemde tekrar almalısın.' })
    }
  }

  const order = { error: 0, warning: 1, info: 2 }
  issues.sort((a, b) => order[a.level] - order[b.level])
  return {
    ects,
    limits,
    issues,
    errors: issues.filter((i) => i.level === 'error').length,
    canFinalize: selection.length > 0 && !issues.some((i) => i.level === 'error'),
  }
}
