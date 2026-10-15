import { COURSES, SECTIONS, findSection, SLOTS, DAYS } from '../data/catalog.js'

// Seçili şubelerden haftalık blok listesi üretir.
export function blocksFor(selection, source = SECTIONS) {
  const blocks = []
  for (const { code, no } of selection) {
    const sec = findSection(code, no, source)
    if (!sec) continue
    sec.meetings.forEach((m, i) => {
      blocks.push({ id: `${code}#${no}#${i}`, code, no, name: COURSES[code].name, ...m, instructor: sec.instructor })
    })
  }
  return blocks
}

function overlaps(a, b) {
  return a.day === b.day && a.start < b.start + b.len && b.start < a.start + a.len
}

// Aynı gün ve saatte çakışan dersleri bulur.
export function findConflicts(selection, source = SECTIONS) {
  const blocks = blocksFor(selection, source)
  const pairs = []
  const seen = new Set()
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]
      if (a.code === b.code) continue
      if (!overlaps(a, b)) continue
      const key = [a.code, b.code].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const start = Math.max(a.start, b.start)
      pairs.push({ a: a.code, b: b.code, day: a.day, start, label: `${DAYS[a.day]} ${SLOTS[start].start}` })
    }
  }
  return pairs
}

export function conflictCodes(selection, ignore = new Set(), source = SECTIONS) {
  const set = new Set()
  findConflicts(selection, source).forEach((p) => {
    if (ignore.has(p.a) || ignore.has(p.b)) return
    set.add(p.a); set.add(p.b)
  })
  return set
}

// Yalnızca izin verilen (F ile kalınan dersin) çakışmalarına giren dersler
export function softConflictCodes(selection, ignore, source = SECTIONS) {
  const hard = conflictCodes(selection, ignore, source)
  const set = new Set()
  findConflicts(selection, source).forEach((p) => {
    if (!(ignore.has(p.a) || ignore.has(p.b))) return
    if (!hard.has(p.a)) set.add(p.a)
    if (!hard.has(p.b)) set.add(p.b)
  })
  return set
}

// Verilen dersler için çakışmasız şube kombinasyonu arar (geri izleme).
// fixed: kullanıcının kilitlediği şubeler. Dolu şubeler tercih edilmez.
export function solveSections(codes, { fixed = {}, allowFull = false, limit = 5, ignore = new Set() } = {}) {
  const results = []
  const order = [...codes].sort((a, b) => (SECTIONS[a]?.length || 0) - (SECTIONS[b]?.length || 0))
  const chosen = []
  function rec(i) {
    if (results.length >= limit) return
    if (i === order.length) {
      results.push(chosen.map((c) => ({ ...c })))
      return
    }
    const code = order[i]
    let options = SECTIONS[code] || []
    if (fixed[code]) options = options.filter((s) => s.no === fixed[code])
    if (!allowFull) options = options.filter((s) => s.enrolled < s.capacity || fixed[code] === s.no)
    for (const sec of options) {
      chosen.push({ code, no: sec.no })
      if (findConflicts(chosen).every((p) => ignore.has(p.a) || ignore.has(p.b))) rec(i + 1)
      chosen.pop()
    }
  }
  rec(0)
  return results
}

export function weeklyHours(code) {
  const sec = (SECTIONS[code] || [])[0]
  if (!sec) return 0
  return sec.meetings.reduce((s, m) => s + m.len, 0)
}

export function timeRange(m) {
  return `${SLOTS[m.start].start}–${SLOTS[m.start + m.len - 1].end}`
}
