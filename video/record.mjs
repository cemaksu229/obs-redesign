// Pusula tanıtım videosu: uygulamayı senaryoya göre gezdirip yüksek kaliteli kare kaydı alır.
// Her adım, seslendirilen cümlesinin süresi kadar sürer; cümle başlangıç zamanları cues.json'a yazılır.
//
// Kullanım: node record.mjs <durations.json> <çıktı_klasörü>
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const [durationsPath, outDir] = process.argv.slice(2)
const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'))
const APP = 'http://localhost:4173'
const STAGE = 'http://localhost:4174'
const GAP = 0.35 // cümleler arası nefes (sn)

fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true })

// Sabit "şimdi": 15 Ekim 2026 Perşembe 13:52 (ekle-bırak son günden bir gün önce, ders saati)
const INIT = `
(() => {
  const FIX = new Date('2026-10-15T13:52:00+03:00').getTime()
  const RealDate = Date
  const offset = FIX - RealDate.now()
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(RealDate.now() + offset); else super(...a) }
    static now() { return RealDate.now() + offset }
  }
  window.Date = FakeDate
  if (window.top !== window || location.port === '4174') return
  const install = () => {
    if (document.getElementById('fake-cursor')) return
    const c = document.createElement('div')
    c.id = 'fake-cursor'
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.8 L11.8 21.6 L14.6 20.3 L11.5 13.6 L17.6 13.4 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'
    Object.assign(c.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-3px,-2px)', transition: 'none' })
    document.documentElement.appendChild(c)
    const ring = document.createElement('div')
    ring.id = 'fake-ring'
    Object.assign(ring.style, { position: 'fixed', width: '34px', height: '34px', marginLeft: '-17px', marginTop: '-17px', borderRadius: '50%', border: '3px solid #e3a21a', zIndex: 2147483646, pointerEvents: 'none', opacity: '0', transform: 'scale(.4)', transition: 'opacity 380ms ease, transform 380ms ease' })
    document.documentElement.appendChild(ring)
    window.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    window.addEventListener('mousedown', (e) => {
      ring.style.transition = 'none'; ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px'; ring.style.opacity = '1'; ring.style.transform = 'scale(.4)'
      requestAnimationFrame(() => { ring.style.transition = 'opacity 420ms ease, transform 420ms ease'; ring.style.opacity = '0'; ring.style.transform = 'scale(1.5)' })
    }, true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install()
})()
`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1920 / 1440, timezoneId: 'Europe/Istanbul', locale: 'tr-TR' })
await ctx.grantPermissions(['notifications'], { origin: APP })
await ctx.addInitScript(INIT)
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))

// Başlangıç durumu: temiz demo, Deniz seçili
await page.goto(`${APP}/#/`)
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('pusula:v1', JSON.stringify({ studentId: 'deniz', theme: 'light' })) })
await page.reload()
await page.waitForTimeout(1200)

// ---------- İmleç yardımcıları ----------
let cur = { x: 1300, y: 700 }
await page.mouse.move(cur.x, cur.y)
async function moveTo(x, y, ms = 650) {
  const steps = Math.max(8, Math.round(ms / 16))
  const from = { ...cur }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e)
    await sleep(16)
  }
  cur = { x, y }
}
async function to(locator, ms) {
  await locator.scrollIntoViewIfNeeded()
  const b = await locator.boundingBox()
  await moveTo(b.x + b.width / 2, b.y + b.height / 2, ms)
}
async function click(locator, ms) {
  await to(locator, ms)
  await sleep(120)
  await page.mouse.down(); await sleep(70); await page.mouse.up()
}
async function smoothScroll(y, ms = 900) {
  await page.evaluate(([top]) => window.scrollTo({ top, behavior: 'smooth' }), [y])
  await sleep(ms)
}
async function scrollTo(locator, offset = 90) {
  const top = await locator.evaluate((el, off) => el.getBoundingClientRect().top + window.scrollY - off, offset)
  await smoothScroll(Math.max(0, top))
}
async function switchStudent(name) {
  await click(page.locator('.student-btn'), 600)
  await sleep(350)
  await click(page.getByRole('menuitemradio', { name: new RegExp(name) }), 500)
  await sleep(500)
}

// ---------- Kare kaydı (CDP screencast) ----------
const cdp = await ctx.newCDPSession(page)
const frames = []
let n = 0
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = `f${String(n++).padStart(6, '0')}.jpg`
  fs.writeFileSync(path.join(outDir, 'frames', file), Buffer.from(data, 'base64'))
  frames.push({ file, t: metadata.timestamp })
  try { await cdp.send('Page.screencastFrameAck', { sessionId }) } catch {}
})
const t0 = Date.now() / 1000
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
// İmleci hafifçe oynatarak ilk kareyi tetikle
await moveTo(1250, 650, 300)
await sleep(600)

const cues = {}
async function say(id, action = async () => {}) {
  const start = Date.now() / 1000 - t0
  cues[id] = start
  await action()
  const elapsed = Date.now() / 1000 - t0 - start
  const left = (durations[id] || 0) + GAP - elapsed
  if (left > 0) await sleep(left * 1000)
  else console.log(`! ${id} eylemi sesten ${(-left).toFixed(2)} sn uzun sürdü`)
}

// ---------- Senaryo ----------
// 01 Kanca
await say('s01', async () => { await moveTo(760, 300, 1400) })
await say('s02', async () => { await to(page.locator('.sidebar .brand'), 1200) })

// 02 Bugün
await say('s03', async () => {
  await to(page.locator('.timeline'), 900)
  await sleep(900)
  await to(page.locator('.deadline'), 900)
})
await say('s04', async () => { await to(page.locator('.callout').first(), 900) })

// 03 Arama
await say('s05', async () => { await to(page.locator('.sidebar nav'), 900) })
await say('s06', async () => {
  await click(page.locator('.search-btn'), 700)
  await sleep(400)
  await page.locator('.palette-input input').pressSequentially('transkript', { delay: 90 })
  await sleep(1300)
})
await page.keyboard.press('Escape')

// 04 Ders kaydı (Deniz)
await say('s07', async () => {
  await click(page.locator('.sidebar').getByRole('link', { name: /Ders kaydı/ }), 800)
  await sleep(900)
  await to(page.locator('.issues'), 900)
})
await say('s08', async () => { await click(page.getByRole('button', { name: 'EEE 3435 dersini ekle' }), 900) })
await say('s09', async () => {
  await to(page.locator('.week-grid').first(), 900)
  await sleep(700)
  await click(page.getByRole('button', { name: /Çakışmasız şube bul/ }), 1000)
})
await say('s10', async () => { await to(page.locator('.issues .callout').first(), 700) })
await say('s11', async () => { await click(page.getByRole('button', { name: /Kesinleştir ve danışmana gönder/ }), 900); await sleep(400); await smoothScroll(0, 700) })

// 05 Program önerici (Ece)
await say('s12', async () => {
  await switchStudent('Ece Yılmaz')
  await click(page.getByRole('button', { name: /Müfredatımdaki dersleri ekle/ }), 800)
})
await say('s13', async () => {
  await click(page.getByRole('button', { name: /Tercihlerime göre program öner/ }), 700)
  await sleep(300)
  await click(page.locator('#planner-text'), 500)
  await page.locator('#planner-text').pressSequentially("Cuma boş olsun, 10'dan önce ders istemiyorum", { delay: 32 })
})
await say('s14', async () => { await scrollTo(page.locator('.plans'), 250); await to(page.locator('.plan.best .mini-week'), 900) })
await say('s15', async () => {
  await to(page.locator('.plan.best .plan-facts'), 700)
  await sleep(800)
  await click(page.locator('.plan.best button'), 800)
  await sleep(300)
  await smoothScroll(0, 600)
})
// Sessiz geçiş: anlatım önden seçime geçmeden ekran hazır olsun
await switchStudent('Deniz Arslan')
await click(page.locator('.sidebar').getByRole('link', { name: /Önden seçim/ }), 700)
await sleep(400)

// 06 Önden seçim (Deniz)
await say('s16', async () => {
  await to(page.locator('.opening-count'), 900)
})
await say('s17', async () => {
  await scrollTo(page.locator('.queue'), 120)
  await to(page.locator('.q-item').nth(2).locator('.sec-chip').first(), 800)
  await sleep(500)
  await to(page.locator('.backup').first(), 800)
})
await say('s18', async () => { await scrollTo(page.locator('.reg-side .issue-list, .reg-side .callout').first(), 140); await to(page.locator('.reg-side .issue-list, .reg-side .callout').first(), 800) })
await say('s19', async () => {
  await scrollTo(page.locator('.demo-box'), 360)
  await click(page.getByRole('button', { name: /10 saniye sonra/ }), 800)
})
// Zamanlayıcının dolmasını bekle (kalan süre)
await page.locator('.toast').waitFor({ timeout: 15000 })
await say('s20', async () => { await smoothScroll(0, 600); await to(page.locator('.toast'), 900) })
await say('s21', async () => { await scrollTo(page.locator('.log'), 140); await to(page.locator('.log-item.changed').first(), 900) })

// 07 Mezuniyet ve telefon
await click(page.locator('.sidebar').getByRole('link', { name: /Mezuniyet/ }), 700)
await sleep(400)
await say('s22', async () => {
  await scrollTo(page.locator('.curriculum'), 140)
  await to(page.locator('.cur-col.is-current'), 800)
})
await say('s23', async () => {
  await page.goto(`${STAGE}/stage.html`)
  await sleep(500)
})

// 08 Kapanış
await say('s24', async () => {
  await page.goto(`${STAGE}/outro.html`)
})
await sleep(1500)
await cdp.send('Page.stopScreencast')
const end = Date.now() / 1000 - t0

fs.writeFileSync(path.join(outDir, 'frames.json'), JSON.stringify({ t0, end, frames }))
fs.writeFileSync(path.join(outDir, 'cues.json'), JSON.stringify(cues, null, 1))
console.log('kare', frames.length, 'süre', end.toFixed(1))
await browser.close()
