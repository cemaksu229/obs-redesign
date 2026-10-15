# Pusula — öğrenci bilgi sistemi yeniden tasarımı

Yaşar Üniversitesi OBS'nin öğrenci tarafı için hızlı, anlaşılır ve telefonda da rahat kullanılan bir yeniden tasarım konsepti. Odak noktası **ders kaydı** sırasında en sık yaşanan sorunlar.

**Canlı demo:** https://cemaksu229.github.io/obs-redesign/

> Tüm öğrenci, ders, şube ve not verileri kurgusaldır. Uygulama gerçek OBS'ye bağlanmaz.

![Bugün ekranı](docs/screenshots/bugun.png)

## Çözdüğü sorunlar

Mevcut OBS gezilerek çıkarılan sorunlar ve Pusula'daki karşılıkları ([ayrıntılı analiz](docs/obs-haritasi.md)):

| Mevcut OBS | Pusula |
|---|---|
| 48 menü öğesi, 8 grup, hiçbir grubun başlığı yok | 6 adlandırılmış ana bölüm, geri kalanı gruplanmış tek sayfada, her şey **Ctrl+K** ile aranabilir |
| Ders programı saat saat uzun bir liste, çakışmalar görünmüyor | Haftalık ızgara, "şu an" çizgisi, çakışmalar kırmızı, telefonda gün gün görünüm, takvime aktarma (.ics) |
| Açılan derslerde her şube ayrı satır, saat/hoca/kontenjan yok | Şubeler tek kartta: gün-saat, öğretim elemanı, kalan kontenjan çubuğu, bölüm/sınıf filtresi |
| Kayıtta kontenjan, çakışma ve kurallar ancak "Kontrol et" sonrası görülüyor | Seçtikçe canlı program önizlemesi ve anlık kural kontrolü, tek tıkla **çakışmasız şube bulma** |
| Mezuniyet ilerlemesi "kurallar eksik" deyip hesaplanmıyor | AKTS, zorunlu, seçmeli ve staj halkaları, renkli müfredat haritası, kalan dersler listesi |
| Her sayfa açılışında modal duyuru | Kapatılabilir duyurular ve öğrenciye özel "son gün" uyarısı ana sayfada |
| Sayfaların adresi yok (iframe) | Her ekranın kendi adresi var, yer imi ve paylaşım yapılabilir |

## Ders kaydı kuralları

Kayıt ekranı, üniversitenin ders kayıt rehberindeki kuralları anlık kontrol eder:

- **AKTS sınırı:** dönem başına 20–40 AKTS, ilk iki yarıyılda en fazla 30, AGNO 2,00'ın altındaysa en fazla 32. Staj limite dahil değil.
- **Çakışma:** çakışan iki yeni ders alınamaz. F ile kalınan dersin çakışmasına izin verilir ve uyarı gösterilir.
- **Ön koşul:** geçilmemiş ön koşulu olan ders eklenemez.
- **Kontenjan:** dolu şube seçilemez, varsa boş şube önerilir.
- **Alttan dersler:** başarısız zorunlu ders açıldığı ilk dönemde alınmalıdır.
- **Sınamalı öğrenci:** üst sınıf dersi alamaz.
- **Tekrar:** C-, D+, D ile geçilen dersler tekrar alınabilir, daha yüksek notla geçilenler alınamaz.

Akış: **Dersleri seç → Kontrol et → Kesinleştir → Danışman onayı**. Hata varken kesinleştirme butonu kapalıdır.

![Ders kaydı](docs/screenshots/ders-kaydi.png)

## Demo öğrencileri

Sağ üstteki menüden öğrenci değiştirilebilir. Her biri farklı bir bölümden ve farklı bir durumu gösteriyor:

| Öğrenci | Bölüm | Gösterdiği durum |
|---|---|---|
| Deniz Arslan | Elektrik-Elektronik Müh., 4. sınıf | Taslak kayıt, alttan ders eksik, F ile kalınan dersin izinli çakışması |
| Elif Karaca | Bilgisayar Müh., 3. sınıf | Onaylanmış kayıt, açıklanmış ara sınav notları |
| Mert Yıldız | Endüstri Müh., 2. sınıf | Sınamalı (AGNO < 2,00), 32 AKTS sınırı, henüz ders seçmemiş |
| Zeynep Aydoğan | İşletme, 1. sınıf | İlk dönem, 30 AKTS sınırı, transkript yok |

Menüdeki "Bu öğrencinin kaydını demo başına al" seçeneği, sunum öncesi her şeyi sıfırlar.

## Ekranlar

| Koyu mod | Telefon |
|---|---|
| ![Ders programı koyu mod](docs/screenshots/program-koyu.png) | ![Telefonda bugün](docs/screenshots/telefon-bugun.png) |

![Mezuniyet](docs/screenshots/mezuniyet.png)

## Teknik

- **React + Vite**, yönlendirme için `react-router` (HashRouter, GitHub Pages uyumlu)
- **PWA:** telefona ve masaüstüne uygulama olarak yüklenebilir, çevrimdışı açılır (`vite-plugin-pwa`)
- Yazı tipleri: Bricolage Grotesque ve Onest (Türkçe karakter desteği tam), ikonlar: Phosphor
- Arka uç yok: kurgusal veri `src/data/` içinde, seçimler tarayıcıda saklanır

```
src/
  data/        kurgusal katalog, müfredatlar, şubeler, öğrenciler, akademik takvim
  lib/         çakışma bulma ve şube çözücü, kayıt kuralları, not ortalaması, mezuniyet hesabı
  components/  kabuk, haftalık program ızgarası, arama paleti
  pages/       Bugün, Program, Kayıt, Açılan dersler, Notlar, Mezuniyet, Belgeler
```

### Çalıştırma

```bash
npm install
npm run dev       # geliştirme sunucusu
npm run build     # dist/ klasörüne üretim çıktısı
```

`main` dalına her push'ta GitHub Actions uygulamayı derleyip GitHub Pages'e yayınlar.

## Geliştirme süreci

Bu proje "Mühendislik Uygulamaları için Üretken Yapay Zeka" dersi ödevi olarak Claude ile birlikte geliştirildi:

1. Mevcut OBS, tarayıcı üzerinden salt okunur gezilerek analiz edildi (kişisel veri alınmadı): [docs/obs-haritasi.md](docs/obs-haritasi.md)
2. Üniversitenin ders kayıt rehberindeki kurallar çıkarıldı
3. Tasarım için `frontend-design`, `redesign-existing-projects` ve `web-design-guidelines` skill'leri kullanıldı (`.claude/skills/`)
