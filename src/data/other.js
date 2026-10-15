// Eski OBS'deki başlıksız 48 menü öğesinin, anlamlı gruplara ayrılmış hâli.
// Ana akışta olmayanlar "Belgeler ve başvurular" sayfasında ve aramada bulunur.
export const OTHER_GROUPS = [
  {
    id: 'belgeler',
    title: 'Belgeler',
    desc: 'Resmî çıktılar ve talepler',
    items: [
      { id: 'transkript', title: 'Transkript', desc: 'Notlar sayfasındaki Transkript sekmesinde', to: '/notlar' },
      { id: 'transkript-senaryo', title: 'Transkript senaryosu', desc: 'Not değişirse ortalamam ne olur?', to: '/notlar' },
      { id: 'ogrenci-belgesi', title: 'Öğrenci belgesi', desc: 'e-Devlet uyumlu, karekodlu' },
      { id: 'belge-talebi', title: 'Belge talebi', desc: 'Islak imzalı belgeler için başvuru' },
      { id: 'mufredat-paketi', title: 'Müfredat bilgi paketi', desc: 'Ders içerikleri ve öğrenme çıktıları' },
    ],
  },
  {
    id: 'basvurular',
    title: 'Başvurular',
    desc: 'Dilekçe gerektiren işlemler',
    items: [
      { id: 'mazeret', title: 'Mazeret sınavı başvurusu', desc: 'Rapor tarihinden itibaren 5 iş günü içinde' },
      { id: 'ek-sinav', title: 'Ek sınav başvurusu', desc: 'Azami süresi dolan öğrenciler için' },
      { id: 'tek-ders', title: 'Tek ders sınavı', desc: 'Mezuniyete tek dersi kalanlar için' },
      { id: 'dondurma', title: 'Kayıt dondurma', desc: 'Sağlık, askerlik ve diğer gerekçeler' },
      { id: 'intibak', title: 'İntibak başvurusu', desc: 'Önceki öğrenimden ders sayılması' },
      { id: 'cekilme', title: 'Dersten çekilme (W)', desc: 'Dönem başına en fazla 4 ders' },
      { id: 'byl', title: 'Bütünleşik yüksek lisans', desc: 'Lisans + yüksek lisans programı' },
      { id: 'mikro', title: 'Mikro yeterlilik', desc: 'Sertifika programları' },
    ],
  },
  {
    id: 'bilgiler',
    title: 'Kişisel ve mali bilgiler',
    desc: 'Profil, harç, staj',
    items: [
      { id: 'ozluk', title: 'Özlük bilgileri', desc: 'Adres, telefon, iletişim tercihleri' },
      { id: 'harc', title: 'Harç bilgileri', desc: 'Ödemeler ve borç durumu' },
      { id: 'staj', title: 'Staj bilgileri', desc: 'Mezuniyet sayfasında staj gün sayın görünür', to: '/mezuniyet' },
      { id: 'danisman', title: 'Danışman bilgileri', desc: 'Danışmanın ve görüşme saatleri' },
      { id: 'bilgi-formu', title: 'Öğrenci bilgi formu' },
    ],
  },
  {
    id: 'iletisim',
    title: 'Mesajlar ve anketler',
    desc: 'Duyurular, mesajlar, değerlendirmeler',
    items: [
      { id: 'duyurular', title: 'Duyurular', desc: 'Bugün sayfasında da görünür', to: '/' },
      { id: 'mesajlar', title: 'Gelen ve gönderilen mesajlar' },
      { id: 'anketler', title: 'Anketler ve ders değerlendirme formları' },
      { id: 'yapilacaklar', title: 'Yapılacaklar listesi' },
    ],
  },
  {
    id: 'hazirlik',
    title: 'Hazırlık sınıfı',
    desc: 'Yabancı dil hazırlık programı',
    items: [
      { id: 'haz-program', title: 'Hazırlık ders programı' },
      { id: 'haz-not', title: 'Hazırlık not listesi' },
      { id: 'haz-sinav', title: 'Hazırlık sınav takvimi' },
      { id: 'haz-devam', title: 'Hazırlık devamsızlık durumu' },
    ],
  },
]
