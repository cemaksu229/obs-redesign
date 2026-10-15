# Tanıtım videosu

Pusula'nın İngilizce anlatımlı ve altyazılı tanıtım videosunu yeniden üretmek için kullanılan dosyalar.

| Dosya | Görevi |
|---|---|
| `script.json` | Cümle cümle anlatım metni |
| `tts.py` | Her cümleyi çevrimdışı seslendirir (Kokoro, `af_heart` sesi) ve sürelerini çıkarır |
| `record.mjs` | Uygulamayı Playwright ile senaryoya göre gezdirir, her adımı kendi cümlesinin süresi kadar tutar, kareleri kaydeder |
| `stage.html`, `outro.html` | Telefon (açık/koyu) sahnesi ve kapanış kartı |
| `build.py` | Kareleri, sesleri ve siyah kutulu altyazıları birleştirip 1080p MP4 üretir |

Hikâye kurgusu, `product-launch-video` skill'inin (skills.sh, heygen-com/hyperframes) değer-önce anlatım kurallarına göre yazıldı.

```bash
# 1. Uygulamayı derle ve yayınla (4173), sahneleri sun (4174)
npm run build && npx vite preview --port 4173 &
(cd video && python3 -m http.server 4174 &)
# 2. Seslendirme (Kokoro model dosyaları: github.com/thewh1teagle/kokoro-onnx releases)
python3 video/tts.py kokoro-v1.0.int8.onnx voices-v1.0.bin out/audio af_heart
# 3. Kayıt ve montaj
node video/record.mjs out/audio/durations.json out/rec
python3 video/build.py out/rec out/audio out/pusula-tanitim.mp4
```
