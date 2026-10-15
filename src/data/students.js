// Kurgusal demo öğrencileri. Dört farklı bölüm, dört farklı durum.
import { COURSES, CURRICULA, ELECTIVE_GROUPS, TERM, SECTIONS } from './catalog.js'
import { mulberry32, hashStr } from '../lib/random.js'
import { scoreToLetter } from '../lib/grades.js'
import { solveSections, findConflicts } from '../lib/schedule.js'

function termLabel(entryYear, k) {
  const y = entryYear + Math.floor((k - 1) / 2)
  return `${y}-${y + 1} ${k % 2 === 1 ? 'Güz' : 'Bahar'}`
}

// Geçmiş dönemlerin transkriptini müfredattan üretir.
function buildTranscript({ id, dept, entryYear, semester, mean, forced = {} }) {
  const rnd = mulberry32(hashStr(id))
  const used = new Set()
  const terms = []
  for (let k = 1; k < semester; k++) {
    const items = CURRICULA[dept].semesters[k - 1]
    const records = []
    for (const item of items) {
      let code = item
      if (typeof item === 'object') {
        code = ELECTIVE_GROUPS[item.group].pool.find((c) => !used.has(c))
      }
      if (!code) continue
      used.add(code)
      const noise = (rnd() + rnd() + rnd() - 1.5) * 22
      const score = Math.max(30, Math.min(98, mean * 22 + 8 + noise))
      const letter = forced[code] || scoreToLetter(score)
      records.push({ code, name: COURSES[code].name, ects: COURSES[code].ects, credit: COURSES[code].credit, letter })
    }
    terms.push({ index: k, label: termLabel(entryYear, k), records })
  }
  return terms
}

const RAW = [
  {
    id: 'deniz',
    name: 'Deniz Arslan',
    number: '23070001842',
    dept: 'EEE',
    entryYear: 2023,
    semester: 7,
    mean: 2.75,
    forced: { 'MATH 3305': 'F', 'EEE 3422': 'D', 'EEE 2214': 'C-' },
    advisor: 'Doç. Dr. Leyla Tunalı',
    internshipDays: 20,
    // Ekle/bırak devam ediyor, seçim taslak hâlinde ve içinde bir çakışma var
    registration: { status: 'draft', codes: ['EEE 4910', 'ENGR 4400', 'EEE 4830', 'MATH 3305', 'UFND 6220', 'EEE 4250', 'ESE 4240'], forceConflict: true },
    absences: { 'MATH 3305': 9, 'EEE 4910': 2, 'ENGR 4451': 3 },
    midterms: {},
  },
  {
    id: 'elif',
    name: 'Elif Karaca',
    number: '24070003317',
    dept: 'CE',
    entryYear: 2024,
    semester: 5,
    mean: 3.45,
    forced: {},
    advisor: 'Dr. Öğr. Üyesi Onur Bilgin',
    internshipDays: 0,
    registration: { status: 'approved', codes: ['CE 3105', 'CE 3205', 'CE 3310', 'CE 3420', 'TURK 1110', 'UFND 2110'] },
    absences: { 'CE 3310': 4, 'CE 3420': 2 },
    midterms: {
      'CE 3105': [{ name: 'Ara sınav', weight: 30, score: 84 }, { name: 'Proje 1', weight: 10, score: 92 }],
      'CE 3205': [{ name: 'Ara sınav', weight: 35, score: 77 }],
      'CE 3310': [{ name: 'Ara sınav', weight: 30, score: 68 }, { name: 'Lab raporları', weight: 15, score: 95 }],
    },
  },
  {
    id: 'mert',
    name: 'Mert Yıldız',
    number: '25070002296',
    dept: 'IE',
    entryYear: 2025,
    semester: 3,
    mean: 2.45,
    forced: { 'MATH 1131': 'F', 'PHYS 1121': 'NA', 'MATH 1132': 'D', 'SOFL 1102': 'C-' },
    advisor: 'Prof. Dr. Cihan Özdemir',
    internshipDays: 0,
    // Sınamalı öğrenci, kaydını henüz yapmadı
    registration: { status: 'draft', codes: [] },
    absences: {},
    midterms: {},
  },
  {
    id: 'ece',
    name: 'Ece Yılmaz',
    number: '26070001175',
    dept: 'CE',
    entryYear: 2026,
    semester: 1,
    mean: 3,
    forced: {},
    advisor: 'Dr. Öğr. Üyesi Onur Bilgin',
    internshipDays: 0,
    // Yeni öğrenci, kaydını henüz yapmadı: program önericiyi denemek için
    registration: { status: 'draft', codes: [] },
    absences: {},
    midterms: {},
  },
  {
    id: 'zeynep',
    name: 'Zeynep Aydoğan',
    number: '26070004508',
    dept: 'BA',
    entryYear: 2026,
    semester: 1,
    mean: 3,
    forced: {},
    advisor: 'Öğr. Gör. Derya Akbulut',
    internshipDays: 0,
    registration: { status: 'approved', codes: ['BA 1101', 'ECON 1101', 'MATH 1050', 'SOFL 1101', 'BA 1120', 'UMFD 1020'] },
    absences: { 'MATH 1050': 3 },
    midterms: {},
  },
]

function initialSelection(raw) {
  const { codes, forceConflict } = raw.registration
  if (!codes.length) return []
  if (forceConflict) {
    // Kurgu: öğrenci şubeleri elle seçmiş ve bir çakışmayı fark etmemiş.
    const ignore = new Set(Object.entries(raw.forced).filter(([, l]) => l === 'F').map(([c]) => c))
    const ok = solveSections(codes.slice(0, -1), { limit: 1, ignore })[0] || codes.slice(0, -1).map((c) => ({ code: c, no: 1 }))
    const last = codes[codes.length - 1]
    // Son ders için, başka bir şubesi çakışmasız olduğu hâlde çakışan şubeyi seç (çözücü düzeltebilsin)
    const hard = (sel) => findConflicts(sel).some((p) => !ignore.has(p.a) && !ignore.has(p.b))
    const clash = (SECTIONS[last] || []).find((sec) => hard([...ok, { code: last, no: sec.no }]))
    return [...ok, { code: last, no: clash ? clash.no : 1 }]
  }
  return solveSections(codes, { limit: 1, allowFull: true })[0] || codes.map((c) => ({ code: c, no: 1 }))
}

export const STUDENTS = RAW.map((raw) => ({
  ...raw,
  transcript: buildTranscript(raw),
  term: TERM,
  registration: { status: raw.registration.status, selection: initialSelection(raw) },
}))

export function getStudent(id) {
  return STUDENTS.find((s) => s.id === id) || STUDENTS[0]
}
