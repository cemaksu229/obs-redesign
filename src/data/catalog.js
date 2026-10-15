// Kurgusal ders kataloğu, müfredatlar ve şubeler.
// Gerçek OBS yapısını taklit eder: ders kodu, şube, derslik[kapasite], T/U, kredi, AKTS.

import { mulberry32, hashStr } from '../lib/random.js'

export const DEPARTMENTS = {
  EEE: { code: 'EEE', name: 'Elektrik-Elektronik Mühendisliği', faculty: 'Mühendislik Fakültesi', building: 'M' },
  CE: { code: 'CE', name: 'Bilgisayar Mühendisliği', faculty: 'Mühendislik Fakültesi', building: 'M' },
  IE: { code: 'IE', name: 'Endüstri Mühendisliği', faculty: 'Mühendislik Fakültesi', building: 'T' },
  BA: { code: 'BA', name: 'İşletme', faculty: 'İktisadi ve İdari Bilimler Fakültesi', building: 'B' },
}

// Dersin "sahibi" olan birim: ortak dersler için de bir etiket gerekiyor.
const OWNER_LABEL = {
  MATH: 'Matematik', PHYS: 'Fizik', SOFL: 'Yabancı Diller', HIST: 'Ortak Zorunlu', TURK: 'Ortak Zorunlu',
  UFND: 'Üniversite Seçmeli', UMFD: 'Kurumsal Temel', ENGR: 'Mühendislik Fakültesi', ECON: 'İktisat',
  ESE: 'Enerji Sistemleri', EEE: 'Elektrik-Elektronik Müh.', CE: 'Bilgisayar Müh.', IE: 'Endüstri Müh.', BA: 'İşletme',
}

export const COURSES = {}

// code, name, ects, credit (teorik saat), lab saati, ön koşullar
function add(code, name, ects, credit, lab = 0, prereq = []) {
  const prefix = code.split(' ')[0]
  COURSES[code] = {
    code, name, ects, credit, lab, prereq,
    owner: OWNER_LABEL[prefix] || prefix,
    distance: ['UFND', 'UMFD', 'HIST', 'TURK'].includes(prefix),
  }
}

// Ortak dersler
add('MATH 1131', 'Analiz I', 7, 4, 2)
add('MATH 1132', 'Analiz II', 7, 4, 2, ['MATH 1131'])
add('MATH 1100', 'Matematiksel Mantık', 5, 3)
add('MATH 1050', 'İşletme Matematiği', 6, 3, 2)
add('MATH 2255', 'Doğrusal Cebir', 6, 3, 2)
add('MATH 2259', 'Mühendislik Matematiği', 7, 4, 2, ['MATH 1132'])
add('MATH 3305', 'Olasılık ve Rassal Süreçler', 6, 3, 2)
add('PHYS 1121', 'Fizik I', 7, 3, 2)
add('PHYS 1122', 'Fizik II', 7, 3, 2, ['PHYS 1121'])
add('ENGR 1115', 'Programlamaya Giriş', 5, 2, 2)
add('ENGR 4400', 'Mühendislik Etiği ve Seminer', 2, 1)
add('ENGR 4451', 'Mühendislik Uygulamaları için Üretken Yapay Zeka', 6, 3)
add('SOFL 1101', 'Akademik İngilizce I', 4, 3)
add('SOFL 1102', 'Akademik İngilizce II', 4, 3, 0, ['SOFL 1101'])
add('SOFL 2201', 'Akademik İngilizce III', 4, 3, 0, ['SOFL 1102'])
add('HIST 1110', 'Atatürk İlkeleri ve İnkılap Tarihi I', 2, 2)
add('HIST 1120', 'Atatürk İlkeleri ve İnkılap Tarihi II', 2, 2)
add('TURK 1110', 'Türk Dili I', 2, 2)
add('TURK 1120', 'Türk Dili II', 2, 2)
add('UMFD 1020', 'Eleştirel ve Analitik Düşünmenin Temelleri', 2, 1)
add('UMFD 1120', 'Girişimciliğin Temelleri', 2, 1)
add('UMFD 1220', 'Tasarım Odaklı Düşünmenin Temelleri', 2, 1)
add('ECON 1101', 'İktisada Giriş I', 6, 3)
add('ECON 1102', 'İktisada Giriş II', 6, 3, 0, ['ECON 1101'])

// Üniversite seçmelileri (uzaktan)
add('UFND 3420', 'Sinirbilim ve Nörofelsefe', 4, 2)
add('UFND 4020', 'Estetik Kültürü', 4, 2)
add('UFND 5020', 'Etik Kültürü', 4, 2)
add('UFND 6220', 'Sürdürülebilirlik', 4, 2)
add('UMFD 1720', 'Kariyer Planlama', 4, 2)
add('UFND 2110', 'Fotoğrafçılığa Giriş', 4, 2)

// EEE
add('EEE 2011', 'Devre Teorisi I', 6, 3, 2, ['PHYS 1122'])
add('EEE 2022', 'Devre Teorisi II', 6, 3, 2, ['EEE 2011'])
add('EEE 2110', 'Sayısal Tasarım', 6, 3, 2)
add('EEE 2214', 'Mühendislik Elektromanyetiği', 6, 3, 0, ['PHYS 1122'])
add('EEE 2412', 'Elektronik I', 6, 3, 2, ['EEE 2011'])
add('EEE 3134', 'Mikrokontrolörler', 6, 3, 2, ['EEE 2110'])
add('EEE 3311', 'Sinyaller ve Sistemler', 6, 3)
add('EEE 3422', 'Elektronik II', 6, 3, 2, ['EEE 2412'])
add('EEE 3435', 'Dijital Elektronik', 6, 3)
add('EEE 3520', 'Haberleşme Sistemleri', 6, 3, 0, ['EEE 3311'])
add('EEE 3615', 'Elektromekanik Enerji Dönüşümü', 6, 3, 2)
add('EEE 3638', 'Güç Sistemleri', 6, 3)
add('EEE 3718', 'Geri Besleme Sistemleri', 6, 3, 2, ['EEE 3311'])
add('EEE 4830', 'Staj', 4, 0)
add('EEE 4910', 'Mezuniyet Tasarım Projesi I', 8, 1, 4)
add('EEE 4920', 'Mezuniyet Tasarım Projesi II', 8, 1, 4, ['EEE 4910'])
add('EEE 4531', 'Dijital İşaret İşleme', 6, 3, 0, ['EEE 3311'])
add('EEE 4340', 'Antenler ve Propagasyon', 6, 3, 0, ['EEE 2214'])
add('EEE 4122', 'Endüstriyel Otomasyon', 6, 3, 2)
add('EEE 4250', 'Gömülü Sistem Tasarımı', 6, 3, 2, ['EEE 3134'])
add('EEE 4610', 'Güç Elektroniği', 6, 3)
add('ESE 4240', 'Yenilenebilir Enerji Sistemlerinin Entegrasyonu', 6, 3)
add('EEE 4705', 'Robotik', 6, 3)
add('EEE 4560', 'Görüntü İşleme', 6, 3)

// CE
add('CE 2110', 'Veri Yapıları', 6, 3, 2, ['ENGR 1115'])
add('CE 2210', 'Nesne Yönelimli Programlama', 6, 3, 2, ['ENGR 1115'])
add('CE 2215', 'Ayrık Matematik', 6, 3)
add('CE 2240', 'Algoritmalar', 6, 3, 0, ['CE 2110'])
add('CE 2320', 'Bilgisayar Organizasyonu', 6, 3)
add('CE 2410', 'Veritabanı Sistemleri', 6, 3, 2)
add('CE 3105', 'İşletim Sistemleri', 6, 3, 2, ['CE 2320'])
add('CE 3205', 'Yazılım Mühendisliği', 6, 3)
add('CE 3310', 'Bilgisayar Ağları', 6, 3, 2)
add('CE 3420', 'Programlama Dilleri', 6, 3)
add('CE 3640', 'Yapay Zeka', 6, 3, 0, ['CE 2240'])
add('CE 3520', 'Web Programlama', 6, 3, 2)
add('CE 3350', 'Bilgi Güvenliği', 6, 3)
add('CE 3460', 'Derleyici Tasarımı', 6, 3)
add('CE 4830', 'Staj', 4, 0)
add('CE 4910', 'Bitirme Projesi I', 8, 1, 4)
add('CE 4920', 'Bitirme Projesi II', 8, 1, 4, ['CE 4910'])
add('CE 4650', 'Makine Öğrenmesi', 6, 3, 0, ['MATH 3305'])
add('CE 4380', 'Bulut Bilişim', 6, 3)
add('CE 4420', 'Mobil Uygulama Geliştirme', 6, 3, 2)
add('CE 4510', 'Bilgisayarla Görü', 6, 3)
add('CE 4720', 'Dağıtık Sistemler', 6, 3)
add('CE 4330', 'Siber Güvenlik Uygulamaları', 6, 3, 2)
add('CE 4560', 'Doğal Dil İşleme', 6, 3)
add('CE 4610', 'Oyun Geliştirme', 6, 3, 2)

// IE
add('IE 2110', 'Yöneylem Araştırması I', 6, 3)
add('IE 2205', 'Mühendislik Ekonomisi', 6, 3)
add('IE 2310', 'İmalat Süreçleri', 5, 2, 2)
add('IE 2220', 'Yöneylem Araştırması II', 6, 3, 0, ['IE 2110'])
add('IE 2340', 'Mühendisler için İstatistik', 6, 3)
add('IE 2410', 'İş Etüdü ve Ergonomi', 6, 3)
add('IE 3105', 'Üretim Planlama', 6, 3)
add('IE 3210', 'Stokastik Modeller', 6, 3, 0, ['MATH 3305'])
add('IE 3320', 'Benzetim', 6, 3, 2)
add('IE 3415', 'Kalite Mühendisliği', 6, 3)
add('IE 3520', 'Tedarik Zinciri Yönetimi', 6, 3)
add('IE 3640', 'Tesis Planlama', 6, 3)
add('IE 3710', 'Sistem Analizi ve Tasarımı', 6, 3)
add('IE 3460', 'Veri Analitiği', 6, 3, 2)
add('IE 4830', 'Staj', 4, 0)
add('IE 4910', 'Bitirme Projesi I', 8, 1, 4)
add('IE 4920', 'Bitirme Projesi II', 8, 1, 4, ['IE 4910'])
add('IE 4210', 'Lojistik Sistemleri', 6, 3)
add('IE 4330', 'Proje Yönetimi', 6, 3)
add('IE 4450', 'Karar Analizi', 6, 3)
add('IE 4520', 'Yalın Üretim', 6, 3)
add('IE 4610', 'Sezgisel Yöntemler', 6, 3)
add('IE 4705', 'Finans Mühendisliği', 6, 3)
add('IE 4740', 'Enerji Sistemleri Planlama', 6, 3)
add('IE 4810', 'Sağlık Sistemleri Mühendisliği', 6, 3)

// BA
add('BA 1101', 'İşletmeye Giriş', 6, 3)
add('BA 1120', 'Hukukun Temel Kavramları', 5, 3)
add('BA 1202', 'Yönetim ve Organizasyon', 6, 3)
add('BA 1210', 'Muhasebe I', 6, 3)
add('BA 2105', 'Pazarlama İlkeleri', 6, 3)
add('BA 2110', 'Muhasebe II', 6, 3, 0, ['BA 1210'])
add('BA 2205', 'İşletme İstatistiği I', 6, 3)
add('BA 2310', 'Örgütsel Davranış', 6, 3)
add('BA 2220', 'Finansal Yönetim', 6, 3, 0, ['BA 2110'])
add('BA 2240', 'İşletme İstatistiği II', 6, 3, 0, ['BA 2205'])
add('BA 2410', 'Maliyet Muhasebesi', 6, 3, 0, ['BA 2110'])
add('BA 2350', 'İnsan Kaynakları Yönetimi', 6, 3)
add('BA 3105', 'Üretim Yönetimi', 6, 3)
add('BA 3210', 'Yatırım Analizi', 6, 3, 0, ['BA 2220'])
add('BA 3320', 'Tüketici Davranışı', 6, 3)
add('BA 3415', 'Yönetim Bilişim Sistemleri', 6, 3)
add('BA 3520', 'Stratejik Yönetim', 6, 3)
add('BA 3610', 'Girişimcilik', 6, 3)
add('BA 3640', 'Uluslararası İşletmecilik', 6, 3)
add('BA 3460', 'Araştırma Yöntemleri', 6, 3)
add('BA 4100', 'İş Etiği', 2, 2)
add('BA 4830', 'Staj', 4, 0)
add('BA 4910', 'Bitirme Projesi', 8, 2, 2)
add('BA 4920', 'Uygulamalı Proje', 8, 2, 2, ['BA 4910'])
add('BA 4210', 'Dijital Pazarlama', 6, 3)
add('BA 4330', 'Marka Yönetimi', 6, 3)
add('BA 4450', 'Davranışsal Finans', 6, 3)
add('BA 4520', 'Portföy Yönetimi', 6, 3)
add('BA 4610', 'Veri Odaklı Karar Verme', 6, 3)
add('BA 4630', 'Aile İşletmeleri', 6, 3)
add('BA 4705', 'Sürdürülebilir İşletmecilik', 6, 3)
add('BA 4740', 'E-Ticaret', 6, 3)
add('BA 4810', 'Proje Finansmanı', 6, 3)

// Seçmeli grupları
const UNV_POOL = ['UFND 3420', 'UFND 4020', 'UFND 5020', 'UFND 6220', 'UMFD 1720', 'UFND 2110']

export const ELECTIVE_GROUPS = {
  UNV: { id: 'UNV', name: 'Üniversite seçmelisi', pool: UNV_POOL },
  'EEE-A': { id: 'EEE-A', name: 'Bölüm seçmelisi A', pool: ['EEE 4531', 'EEE 4340', 'EEE 4122'] },
  'EEE-B': { id: 'EEE-B', name: 'Bölüm seçmelisi B', pool: ['ENGR 4451', 'EEE 4250', 'EEE 4610'] },
  'EEE-C': { id: 'EEE-C', name: 'Bölüm seçmelisi C', pool: ['ESE 4240', 'EEE 4705', 'EEE 4560'] },
  'CE-A': { id: 'CE-A', name: 'Bölüm seçmelisi A', pool: ['CE 4650', 'CE 4380', 'CE 4420'] },
  'CE-B': { id: 'CE-B', name: 'Bölüm seçmelisi B', pool: ['CE 4510', 'CE 4720', 'ENGR 4451'] },
  'CE-C': { id: 'CE-C', name: 'Bölüm seçmelisi C', pool: ['CE 4330', 'CE 4560', 'CE 4610'] },
  'IE-A': { id: 'IE-A', name: 'Bölüm seçmelisi A', pool: ['IE 4210', 'IE 4330', 'IE 4450'] },
  'IE-B': { id: 'IE-B', name: 'Bölüm seçmelisi B', pool: ['IE 4520', 'IE 4610', 'ENGR 4451'] },
  'IE-C': { id: 'IE-C', name: 'Bölüm seçmelisi C', pool: ['IE 4705', 'IE 4740', 'IE 4810'] },
  'BA-A': { id: 'BA-A', name: 'Bölüm seçmelisi A', pool: ['BA 4210', 'BA 4330', 'BA 4450'] },
  'BA-B': { id: 'BA-B', name: 'Bölüm seçmelisi B', pool: ['BA 4520', 'BA 4610', 'BA 4630'] },
  'BA-C': { id: 'BA-C', name: 'Bölüm seçmelisi C', pool: ['BA 4705', 'BA 4740', 'BA 4810'] },
}

// Müfredatlar: 8 yarıyıl. Bir öğe ya ders kodu ya da { group, ects } seçmeli yuvası.
const ENG_1 = ['MATH 1131', 'PHYS 1121', 'ENGR 1115', 'SOFL 1101', 'MATH 1100', 'UMFD 1020']
const ENG_2 = ['MATH 1132', 'PHYS 1122', 'MATH 2255', 'SOFL 1102', 'HIST 1110', 'UMFD 1120', 'UMFD 1220']
const E = (group, ects) => ({ group, ects })

export const CURRICULA = {
  EEE: {
    name: '2025 Elektrik-Elektronik Mühendisliği Müfredatı',
    semesters: [
      ENG_1, ENG_2,
      ['EEE 2011', 'EEE 2110', 'MATH 2259', 'SOFL 2201', 'HIST 1120', E('UNV', 4)],
      ['EEE 2022', 'EEE 2214', 'EEE 2412', 'MATH 3305', E('UNV', 4)],
      ['EEE 3435', 'EEE 3615', 'EEE 3134', 'EEE 3311', 'TURK 1110', E('UNV', 4)],
      ['EEE 3718', 'EEE 3638', 'EEE 3520', 'EEE 3422', 'TURK 1120', E('EEE-A', 6)],
      ['EEE 4910', 'ENGR 4400', 'EEE 4830', E('EEE-B', 6), E('EEE-C', 6), E('UNV', 4)],
      ['EEE 4920', E('EEE-A', 6), E('EEE-B', 6), E('EEE-C', 6), E('UNV', 4)],
    ],
  },
  CE: {
    name: '2025 Bilgisayar Mühendisliği Müfredatı',
    semesters: [
      ENG_1, ENG_2,
      ['CE 2110', 'CE 2210', 'CE 2215', 'MATH 2259', 'SOFL 2201', 'HIST 1120'],
      ['CE 2240', 'CE 2320', 'CE 2410', 'MATH 3305', E('UNV', 4)],
      ['CE 3105', 'CE 3205', 'CE 3310', 'CE 3420', 'TURK 1110', E('UNV', 4)],
      ['CE 3640', 'CE 3520', 'CE 3350', 'CE 3460', 'TURK 1120', E('CE-A', 6)],
      ['CE 4910', 'ENGR 4400', 'CE 4830', E('CE-B', 6), E('CE-C', 6), E('UNV', 4)],
      ['CE 4920', E('CE-A', 6), E('CE-B', 6), E('CE-C', 6), E('UNV', 4)],
    ],
  },
  IE: {
    name: '2025 Endüstri Mühendisliği Müfredatı',
    semesters: [
      ENG_1, ENG_2,
      ['IE 2110', 'IE 2205', 'IE 2310', 'MATH 2259', 'SOFL 2201', 'HIST 1120'],
      ['IE 2220', 'IE 2340', 'IE 2410', 'MATH 3305', E('UNV', 4)],
      ['IE 3105', 'IE 3210', 'IE 3320', 'IE 3415', 'TURK 1110', E('UNV', 4)],
      ['IE 3520', 'IE 3640', 'IE 3710', 'IE 3460', 'TURK 1120', E('IE-A', 6)],
      ['IE 4910', 'ENGR 4400', 'IE 4830', E('IE-B', 6), E('IE-C', 6), E('UNV', 4)],
      ['IE 4920', E('IE-A', 6), E('IE-B', 6), E('IE-C', 6), E('UNV', 4)],
    ],
  },
  BA: {
    name: '2025 İşletme Müfredatı',
    semesters: [
      ['BA 1101', 'ECON 1101', 'MATH 1050', 'SOFL 1101', 'BA 1120', 'UMFD 1020'],
      ['BA 1202', 'ECON 1102', 'BA 1210', 'SOFL 1102', 'HIST 1110', 'UMFD 1120', 'UMFD 1220'],
      ['BA 2105', 'BA 2110', 'BA 2205', 'BA 2310', 'SOFL 2201', 'HIST 1120'],
      ['BA 2220', 'BA 2240', 'BA 2410', 'BA 2350', E('UNV', 4)],
      ['BA 3105', 'BA 3210', 'BA 3320', 'BA 3415', 'TURK 1110', E('UNV', 4)],
      ['BA 3520', 'BA 3610', 'BA 3640', 'BA 3460', 'TURK 1120', E('BA-A', 6)],
      ['BA 4910', 'BA 4100', 'BA 4830', E('BA-B', 6), E('BA-C', 6), E('UNV', 4)],
      ['BA 4920', E('BA-A', 6), E('BA-B', 6), E('BA-C', 6), E('UNV', 4)],
    ],
  },
}

// Hangi bölümün öğrencisi için hangi dersler "bölüm dersi" sayılır (Açılan dersler filtresi için)
export function courseDepartments(code) {
  const out = new Set()
  for (const [dept, cur] of Object.entries(CURRICULA)) {
    cur.semesters.forEach((sem) => sem.forEach((item) => {
      if (item === code) out.add(dept)
      if (typeof item === 'object' && ELECTIVE_GROUPS[item.group].pool.includes(code)) out.add(dept)
    }))
  }
  return [...out]
}

export function courseYear(code) {
  const n = parseInt(code.split(' ')[1], 10)
  return Math.min(4, Math.max(1, Math.floor(n / 1000)))
}

// ----- Saatler -----
// Yaşar'da dersler xx:40'ta başlar, 50 dakika sürer.
export const SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 8 + i
  return { index: i, start: `${String(h).padStart(2, '0')}:40`, end: `${String(h + 1).padStart(2, '0')}:30` }
})
export const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']
export const DAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']

// ----- Bu dönem açılan şubeler -----
// Güz döneminde tek yarıyıl dersleri + tüm seçmeliler açılır.
export const TERM = { id: '2026-2027-Guz', label: '2026-2027 Güz', short: 'Güz 2026' }

const FIRST = ['Ayşe', 'Burak', 'Canan', 'Doğan', 'Ebru', 'Fikret', 'Gökçe', 'Hakan', 'İlknur', 'Kaan', 'Leyla', 'Murat', 'Nihan', 'Onur', 'Pelin', 'Serkan', 'Tülay', 'Umut', 'Yasemin', 'Zafer', 'Berna', 'Cihan', 'Derya', 'Emre']
const LAST = ['Kılıçarslan', 'Tunalı', 'Erdem', 'Sezgin', 'Akbulut', 'Karaman', 'Özdemir', 'Yalçın', 'Demirtaş', 'Gürel', 'Aksoy', 'Ertan', 'Uysal', 'Bilgin', 'Çakır', 'Ekinci', 'Soylu', 'Tekin']
const TITLES = ['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Dr. Öğr. Üyesi', 'Öğr. Gör.']

// parity 0 = Güz (1, 3, 5, 7. yarıyıllar), 1 = Bahar (2, 4, 6, 8. yarıyıllar)
function offeredIn(parity) {
  const codes = new Set()
  for (const cur of Object.values(CURRICULA)) {
    cur.semesters.forEach((sem, i) => {
      if (i % 2 !== parity) return
      sem.forEach((item) => { if (typeof item === 'string') codes.add(item) })
    })
  }
  Object.values(ELECTIVE_GROUPS).forEach((g) => g.pool.forEach((c) => codes.add(c)))
  // Başarısız öğrenciler için karşı dönemde de açılan birkaç ders
  const extra = parity === 0 ? ['MATH 1132', 'PHYS 1122', 'MATH 3305', 'EEE 3718'] : ['MATH 1131', 'PHYS 1121', 'EEE 3435', 'ENGR 1115']
  extra.forEach((c) => codes.add(c))
  return [...codes]
}

function sectionCount(code) {
  if (['MATH 1131', 'PHYS 1121', 'ENGR 1115', 'SOFL 1101', 'MATH 1100'].includes(code)) return 4
  if (['SOFL 2201', 'MATH 2259', 'BA 1101', 'ECON 1101', 'MATH 1050'].includes(code)) return 3
  if (code.endsWith('4830') || code.endsWith('4910')) return 1
  if (Object.values(ELECTIVE_GROUPS).some((g) => g.id !== 'UNV' && g.pool.includes(code))) return 2
  const n = parseInt(code.split(' ')[1], 10)
  return n < 3000 ? 2 : 1
}

export const SECTIONS = {} // Bu dönem (Güz): code -> [{ no, instructor, capacity, enrolled, meetings }]
export const SPRING_SECTIONS = {} // Bir sonraki dönem (Bahar) için açıklanan şubeler

// Aynı sınıfın (bölüm + yarıyıl) dersleri birbiriyle çakışmasın diye her "kohort" için dolu saatler tutulur.
// Bir dersin 1. şubesi kohortlarına göre yerleştirilir; diğer şubeler serbest yerleşir (gerçekte de böyle).
function cohortsOf(code, parity = 0) {
  const out = []
  for (const [dept, cur] of Object.entries(CURRICULA)) {
    cur.semesters.forEach((sem, i) => {
      if (i % 2 !== parity) return
      const inSem = sem.some((item) => item === code || (typeof item === 'object' && ELECTIVE_GROUPS[item.group].pool.includes(code) && item.group !== 'UNV'))
      if (inSem) out.push(`${dept}-${i + 1}`)
    })
  }
  return out
}

let OCC = {} // kohort -> Set("gün-slot")
function isFree(cohorts, day, start, len) {
  for (const c of cohorts) {
    const set = OCC[c] || new Set()
    for (let s = start; s < start + len; s++) if (set.has(`${day}-${s}`)) return false
  }
  return true
}
function occupy(cohorts, day, start, len) {
  for (const c of cohorts) {
    OCC[c] = OCC[c] || new Set()
    for (let s = start; s < start + len; s++) OCC[c].add(`${day}-${s}`)
  }
}

// Önce kohortu olan, çok saatli dersler yerleşsin
function placementOrder(codes, parity) {
  return [...codes].sort((a, b) => cohortsOf(b, parity).length - cohortsOf(a, parity).length || (COURSES[b].credit + COURSES[b].lab) - (COURSES[a].credit + COURSES[a].lab))
}

function buildSections(target, parity) {
  OCC = {}
  for (const code of placementOrder(offeredIn(parity), parity)) {
    const course = COURSES[code]
    if (!course) continue
    const rnd = mulberry32(hashStr(parity === 0 ? code : `${code}#Bahar`))
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
    const count = sectionCount(code)
    const cohorts = cohortsOf(code, parity)
    const list = []
    let firstDays = []
    for (let s = 1; s <= count; s++) {
      const meetings = []
      // Aynı numaralı şubeler kendi aralarında çakışmasın (bölümlerin "paralel şube" planlaması)
      const respect = s === 1 ? cohorts : cohorts.map((c) => `${c}#${s}`)
      // Gerçekte olduğu gibi: diğer şubeler mümkünse 1. şubeden farklı günlere konur
      const otherDays = s === 1 ? [] : firstDays
      const place = (len, minStart, maxStart, avoidDays = [], preferDays = []) => {
        for (let tries = 0; tries < 80; tries++) {
          const day = Math.floor(rnd() * 5)
          if (preferDays.length && !preferDays.includes(day) && tries < 50) continue
          if (avoidDays.includes(day) && tries < 60) continue
          if (otherDays.includes(day) && tries < 40) continue
          const start = minStart + Math.floor(rnd() * (maxStart - minStart + 1))
          if (isFree(respect, day, start, len) && !meetings.some((m) => m.day === day && start < m.start + m.len && m.start < start + len)) {
            occupy(respect, day, start, len)
            return { day, start }
          }
        }
        return { day: Math.floor(rnd() * 5), start: minStart }
      }
      const prefix = code.split(' ')[0]
      const dept = DEPARTMENTS[prefix]
      const building = dept ? dept.building : prefix === 'ECON' ? 'B' : pick(['M', 'T', 'Y'])
      const room = `${building}${pick([1, 2, 3, 4, 5])}${String(Math.floor(rnd() * 40) + 1).padStart(2, '0')}`
      const capacity = course.distance ? 1500 : pick([35, 40, 45, 50, 60, 65])
      if (code.endsWith('4830')) {
        // Staj: ders saati yok
      } else if (course.distance) {
        // Uzaktan dersler akşam saatlerinde
        const p = place(2, 10, 12)
        meetings.push({ ...p, len: 2, room: `X00${Math.floor(rnd() * 5) + 1}`, kind: 'T', online: true })
      } else {
        const t = course.credit
        if (t >= 3) {
          const p1 = place(2, 0, 7)
          meetings.push({ ...p1, len: 2, room, kind: 'T' })
          const p2 = place(t - 2, 0, 8, [p1.day])
          meetings.push({ ...p2, len: t - 2, room, kind: 'T' })
        } else if (t > 0) {
          const p = place(t, 0, 8)
          meetings.push({ ...p, len: t, room, kind: 'T' })
        }
        if (course.lab) {
          // Uygulama saatleri çoğunlukla teorik dersle aynı gün, öğleden sonra
          const p = place(course.lab, 3, 8, [], meetings.map((m) => m.day))
          meetings.push({ ...p, len: course.lab, room: `${building}${pick([1, 2])}L${Math.floor(rnd() * 9) + 1}`, kind: 'U' })
        }
      }
      meetings.sort((a, b) => a.day - b.day || a.start - b.start)
      if (s === 1) firstDays = [...new Set(meetings.map((m) => m.day))]
      // Doluluk: çoğu dolmamış, bazıları tam dolu
      const enrolled = course.distance
        ? Math.floor(600 + rnd() * 700)
        : Math.min(capacity - 1, Math.floor(capacity * (0.4 + rnd() * 0.55)))
      list.push({
        no: s,
        instructor: `${pick(TITLES)} ${pick(FIRST)} ${pick(LAST)}`,
        capacity,
        enrolled,
        meetings,
      })
    }
    target[code] = list
  }
  if (parity === 1) {
    // Gelecek dönemin kaydı henüz açılmadı: kontenjanların hepsi boş
    Object.values(target).forEach((list) => list.forEach((sec) => { sec.enrolled = 0 }))
    return
  }
  // Demo için bilinçli olarak tam dolu birkaç şube (kontenjan kuralını göstermek için)
  const FULL = [['EEE 3134', 1], ['CE 4650', 1], ['MATH 1131', 2], ['PHYS 1121', 1], ['IE 3320', 1], ['BA 3210', 1], ['EEE 4705', 1]]
  for (const [code, no] of FULL) {
    const sec = (SECTIONS[code] || []).find((x) => x.no === no)
    if (sec) sec.enrolled = sec.capacity
  }
}
buildSections(SECTIONS, 0)
buildSections(SPRING_SECTIONS, 1)

export const NEXT_TERM = {
  id: '2026-2027-Bahar',
  label: '2026-2027 Bahar',
  opensAt: '2027-02-01T10:00:00',
}

export function sectionKey(code, no) {
  return `${code}#${no}`
}

export function findSection(code, no, source = SECTIONS) {
  return (source[code] || []).find((s) => s.no === no)
}
