// Mezuniyet ilerlemesi: müfredat yuvalarını öğrencinin geçtiği derslerle eşleştirir.
import { COURSES, CURRICULA, ELECTIVE_GROUPS } from '../data/catalog.js'
import { isPassed, gpa, FAILING } from './grades.js'

export function allRecords(student) {
  return student.transcript.flatMap((t) => t.records.map((r) => ({ ...r, term: t.label })))
}

// Her ders için son durum
export function latestByCode(student) {
  const map = new Map()
  for (const r of allRecords(student)) map.set(r.code, r)
  return map
}

export function standing(student) {
  const recs = allRecords(student)
  const value = gpa(recs)
  const passedEcts = [...latestByCode(student).values()].filter((r) => isPassed(r.letter)).reduce((s, r) => s + r.ects, 0)
  const probation = recs.length > 0 && value < 2
  return { gpa: value, passedEcts, probation, hasHistory: recs.length > 0 }
}

export function termGpa(term) {
  return gpa(term.records)
}

export function graduationProgress(student) {
  const cur = CURRICULA[student.dept]
  const latest = latestByCode(student)
  const passed = (c) => latest.has(c) && isPassed(latest.get(c).letter)
  const usedElectives = new Set()
  const slots = []
  cur.semesters.forEach((sem, i) => {
    sem.forEach((item) => {
      if (typeof item === 'string') {
        const r = latest.get(item)
        slots.push({ semester: i + 1, type: 'Z', code: item, name: COURSES[item].name, ects: COURSES[item].ects, done: passed(item), letter: r?.letter, failed: r && FAILING.has(r.letter) })
      } else {
        const g = ELECTIVE_GROUPS[item.group]
        const match = g.pool.find((c) => passed(c) && !usedElectives.has(c))
        if (match) usedElectives.add(match)
        slots.push({ semester: i + 1, type: 'S', group: g.id, code: match || null, name: match ? COURSES[match].name : g.name, groupName: g.name, ects: match ? COURSES[match].ects : item.ects, done: Boolean(match), letter: match ? latest.get(match).letter : null })
      }
    })
  })
  const sum = (arr) => arr.reduce((s, x) => s + x.ects, 0)
  const req = slots.filter((s) => s.type === 'Z')
  const ele = slots.filter((s) => s.type === 'S')
  const internship = req.find((s) => s.code.endsWith('4830'))
  return {
    slots,
    totalEcts: sum(slots),
    doneEcts: sum(slots.filter((s) => s.done)),
    required: { total: req.length, done: req.filter((s) => s.done).length },
    electives: { total: ele.length, done: ele.filter((s) => s.done).length },
    internship: { days: student.internshipDays, required: 20, done: internship ? internship.done : false },
    failed: slots.filter((s) => s.failed && !s.done),
    remaining: slots.filter((s) => !s.done),
  }
}
