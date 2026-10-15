// Harf notları ve ortalama hesapları (Yaşar Üniversitesi 4'lük sistem).
export const LETTER_POINTS = {
  A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0, 'C-': 1.7, 'D+': 1.3, D: 1.0, F: 0, NA: 0,
}

export const FAILING = new Set(['F', 'NA'])
export const LOW_PASS = new Set(['C-', 'D+', 'D']) // tekrar alınabilir notlar

export function isPassed(letter) {
  return letter && !FAILING.has(letter) && letter !== 'W'
}

export function scoreToLetter(score) {
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D+'
  if (score >= 45) return 'D'
  return 'F'
}

// Bir ders birden fazla kez alındıysa ortalamaya son alınan not girer.
export function gpa(records) {
  const latest = new Map()
  for (const r of records) {
    if (!r.letter || r.letter === 'W' || !(r.letter in LETTER_POINTS)) continue
    latest.set(r.code, r)
  }
  let pts = 0
  let ects = 0
  for (const r of latest.values()) {
    pts += LETTER_POINTS[r.letter] * r.ects
    ects += r.ects
  }
  return ects ? pts / ects : 0
}

export function formatGpa(v) {
  return v.toFixed(2).replace('.', ',')
}
