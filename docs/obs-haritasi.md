# OBS haritası (mevcut sistem analizi)

Yaşar Üniversitesi OBS'nin (obs.yasar.edu.tr) öğrenci tarafı 15 Ekim 2026'da gezilerek çıkarılmıştır.
Kişisel veri içermez; yalnızca sayfa yapısı, akışlar ve sorunlar not edilmiştir.

## Genel yapı

- ASP.NET WebForms tabanlı (`__doPostBack`). İçerik ana sayfanın içinde bir iframe'e yükleniyor, bu yüzden sayfaların kendi adresi yok, yer imi veya paylaşım yapılamıyor.
- 60 dakikalık oturum sayacı, süre dolunca "Devam Et" uyarısı.
- Sol tarafta sadece ikonlardan oluşan bir menü şeridi. 8 grup var ve **hiçbir grubun başlığı yok**.
- Toplam **48 menü öğesi**, düz liste hâlinde.

### Menü grupları (başlıksız, sırasıyla)

1. Kullanım Kılavuzu, Özlük Bilgileri, Genel Bilgiler, Akademik Takvim, Danışman Bilgileri, Alınan Dersler, Açılan Bölüm Dersleri, Sınav Takvimi, Ders Programı, Bölüm Ders Programı, Harç Bilgileri, Staj Bilgileri, Genel Duyurular, Mezuniyet Onay Bilgileri, Mezuniyet İlerleme Durumu
2. Ders Kayıt, Ders Ekle/Bırak, Dönem Ortalamaları, Not Listesi, Transkript, Transkript Senaryosu, Diğer Belgeler, Müfredat Durum, Müfredat Bilgi Paketi, Devamsızlık Durumu
3. Anketler, Değerlendirme Formları, Öğrenci Bilgi Formu
4. Belge Talebi
5. İntibak Başvuru
6. Hazırlık: Sınav Takvimi, Not Listesi, Devamsızlık, Ders Programı
7. Başvurular: Kayıt Dondurma, Mazeret Sınavı, Ek Sınav (iki ayrı), Tek Ders, Bütünleşik YL, Mikro Yeterlilik
8. Yapılacaklar Listesi, Gelen Mesajlar, Gönderilen Mesajlar

## Sayfa sayfa

| Sayfa | İçerik | Sorun |
|---|---|---|
| Ana sayfa | 8 bilgi kartı (kimlik, program, öğrenim durumu, süre, ders kayıt özeti, danışman, akademik özet, ek bilgiler) + hızlı erişim | Kartlar aynı bilgiyi tekrar ediyor (program 3 kez). "Bugün ne var?" sorusuna cevap yok. |
| Ders Programı | Dönem seçici, Detaylı/Sade görünüm, saat saat liste. Ders hücresi: `KOD(şube)`, ad, `Derslik[kapasite]`, hoca | Haftalık ızgara yerine saat bloklarına bölünmüş uzun liste. Aynı saatteki dersler alt alta, çakışma görsel olarak anlaşılmıyor. Her açılışta modal duyuru. |
| Açılan Bölüm Dersleri | Şube, kod, ad, sınıf, T, U/L, Kredi, AKTS | Her şube ayrı satır (Fizik I için 17 satır). Gün/saat, hoca, kontenjan yok. Arama/filtre yok. |
| Ders Kayıt | Öğrenci özeti, mali uygunluk, sınıf sekmeleri (1–4), Güz/Bahar/Tümü filtresi, ders listesi, "Seçilen Dersler", Kontrol Et → Kesinleştir, danışman onay durumu | Her açılışta modal. Dar ekranda menü içeriğin üstüne biniyor. Başlıklarda ham `<br>` etiketi görünüyor. Kontenjan ve çakışma ancak kontrol sonrası görülüyor. Seçmeli grup mantığı (ELECT EEE B1, C1…) açıklanmıyor. |
| Müfredat Durum | Dönem dönem müfredat tablosu: müfredat dersi ↔ alınan ders, harf notu, kredi/AKTS toplamları | Çok uzun tek tablo. Eksik dersler görsel olarak öne çıkmıyor. |
| Mezuniyet İlerleme Durumu | AGNO, staj, zorunlu/seçmeli/AKTS tamamlanma oranı, alınmayan ve başarısız dersler | Tamamlanma oranları "mezuniyet kuralları eksik" denilerek hiç hesaplanmıyor. En önemli sayfa fiilen çalışmıyor. |
| Not Listesi | Dönem seçici, ders başına ortalama/not/durum ve istatistik | Notlar girilmemişse 12 kez "Kayıt Yok" tekrarı. |
| Sınav Takvimi | Dönem, sınav tipi, tarih filtresi | Tanım yoksa sadece bir uyarı cümlesi. |
| Devamsızlık Durumu | Dönem seçici, ders başına toplam devamsızlık | Limitin ne kadarının kullanıldığı gösterilmiyor. |
| Akademik Takvim | Etkinlik, başlangıç, bitiş | Düz tablo. "Şu an hangi dönemdeyim, kaç gün kaldı?" bilgisi yok. |

## Ders kayıt kuralları (oim.yasar.edu.tr/ders-kayitlari)

Uygulamadaki kayıt modülü bu kuralları anlık kontrol etmeli:

- Akış: harç öde → kayıt yenile → ders seç → **Kontrol Et** → **Kesinleştir** → danışman onayı. Kesinleşmeyen dersler danışmana gitmez. Onaydan sonra değişikliği sadece danışman yapar.
- AKTS: dönem başı 20–40 (son dönemde alt sınır yok). İlk iki dönem 30. Staj limite dahil değil.
- AGNO ≥ 2.00: 40 AKTS'ye kadar, önce alttan dersler, sonra kendi sınıfı, sonra üst sınıf.
- AGNO ≤ 1.99 (sınamalı): en fazla 32 AKTS, önce başarısız dersler, üst sınıf dersi alamaz.
- Yeni alınan iki ders çakışamaz. NA ile kalınan ders çakışamaz. F/U ile kalınan ders çakışabilir (devam zorunluluğu yok).
- Başarısız zorunlu ders ilk açıldığı dönemde tekrar alınmalı.
- Ön koşullu dersler var.
- Kontenjan dolu ise sistem kesinleştirmeye izin vermiyor, kontenjan talebi bölüm başkanına.
- Ekle/bırak haftası, dersten çekilme (W) en fazla 4 ders.

## Yeni tasarımın çözmesi gerekenler (öncelik sırası)

1. **Anlaşılır navigasyon:** 48 başlıksız öğe yerine 5–6 adlandırılmış bölüm ve arama (komut paleti).
2. **"Bugün" odaklı ana sayfa:** bugünkü dersler, yaklaşan tarihler (akademik takvimden geri sayım), AGNO/AKTS özeti, uyarılar.
3. **Gerçek haftalık ders programı:** ızgara görünüm, çakışmalar kırmızı, uzaktan dersler ayrı işaretli.
4. **Çalışan mezuniyet ilerlemesi:** zorunlu/seçmeli/AKTS halkaları, eksik ders listesi.
5. **Açılan dersler:** şubeler tek kartta gruplanmış, gün/saat/hoca/kontenjan, arama ve filtre.
6. **Ders kayıt (son aşama):** seçerken anlık çakışma, AKTS limiti, ön koşul ve kontenjan kontrolü, programın canlı önizlemesi.
7. **Modal duyuru yok:** duyurular ana sayfada kapatılabilir bir şerit olarak.
8. Mobil uyumlu düzen, sayfaların kendi adresi (paylaşılabilir/yer imi).
