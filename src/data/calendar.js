// 2026-2027 Güz akademik takvimi (demo). Kayıt tarihleri üniversitenin duyurduğu takvime göre.
export const CALENDAR = [
  { id: 'harc', title: 'Harç ödeme', start: '2026-09-07', end: '2026-09-18', kind: 'kayit' },
  { id: 'kayit', title: 'Ders kayıt ve kayıt yenileme', start: '2026-09-14', end: '2026-09-18', kind: 'kayit' },
  { id: 'baslangic', title: 'Derslerin başlaması', start: '2026-09-21', end: '2026-09-21', kind: 'ders' },
  { id: 'ekle', title: 'Ders ekle-bırak ve danışman onayı', start: '2026-09-21', end: '2026-10-16', endTime: '17:30', kind: 'kayit' },
  { id: 'w', title: 'Dersten çekilme (W) son gün', start: '2026-10-09', end: '2026-10-09', endTime: '17:00', kind: 'kayit' },
  { id: 'cumhuriyet', title: 'Cumhuriyet Bayramı (tatil)', start: '2026-10-28', end: '2026-10-29', kind: 'tatil' },
  { id: 'ara', title: 'Ara sınav haftası', start: '2026-11-09', end: '2026-11-20', kind: 'sinav' },
  { id: 'aranot', title: 'Ara sınav notlarının girilmesi', start: '2026-11-21', end: '2026-12-04', kind: 'not' },
  { id: 'son', title: 'Derslerin son günü', start: '2026-12-25', end: '2026-12-25', kind: 'ders' },
  { id: 'final', title: 'Yarıyıl sonu sınavları', start: '2026-12-28', end: '2027-01-08', kind: 'sinav' },
  { id: 'harf', title: 'Harf notlarının ilanı', start: '2027-01-13', end: '2027-01-13', kind: 'not' },
  { id: 'but', title: 'Bütünleme sınavları', start: '2027-01-18', end: '2027-01-24', kind: 'sinav' },
]

export const ANNOUNCEMENTS = [
  {
    id: 'uzaktan',
    title: 'Uzaktan dersler çevrimiçi öğrenme ortamında',
    body: 'Ortak zorunlu ve kurumsal temel dersler çevrimiçi yürütülüyor. İçeriklere çevrimiçi öğrenme ortamından erişebilirsin.',
    date: '2026-09-15',
    tone: 'info',
  },
  {
    id: 'staj',
    title: 'Staj defteri teslimi',
    body: 'Yaz stajını tamamlayanlar onaylı defterlerini staj komisyonuna 30 Ekim\'e kadar teslim etmeli.',
    date: '2026-10-02',
    tone: 'info',
  },
]

export function parseDate(d, time = '23:59') {
  return new Date(`${d}T${time}:00`)
}
