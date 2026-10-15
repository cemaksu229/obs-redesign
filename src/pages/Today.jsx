import { Link } from 'react-router-dom'
import { MapPin, MonitorPlay, Warning, CheckCircle, X, Hourglass, Clock } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import { blocksFor, conflictCodes } from '../lib/schedule.js'
import { standing, graduationProgress } from '../lib/progress.js'
import { validate, selectionEcts, overlapAllowed } from '../lib/rules.js'
import { calendarState, formatDate, relativeDay } from '../lib/dates.js'
import { ANNOUNCEMENTS } from '../data/calendar.js'
import { NEXT_TERM } from '../data/catalog.js'
import { DAYS, SLOTS } from '../data/catalog.js'
import { formatGpa } from '../lib/grades.js'
import { colorIndex } from '../components/WeekGrid.jsx'
import Ring from '../components/Ring.jsx'

function nowSlotPosition(now) {
  return now.getHours() * 60 + now.getMinutes() - (8 * 60 + 40)
}

export default function Today() {
  const { student, dismissed, dismiss, cart } = useApp()
  const now = new Date()
  const reg = student.registration
  const blocks = blocksFor(reg.selection)
  const clashes = conflictCodes(reg.selection, overlapAllowed(student))
  const weekday = (now.getDay() + 6) % 7
  const isWeekend = weekday > 4
  const shownDay = isWeekend ? 0 : weekday
  const dayBlocks = blocks.filter((b) => b.day === shownDay).sort((a, b) => a.start - b.start)
  const minutesNow = nowSlotPosition(now)

  const st = standing(student)
  const prog = graduationProgress(student)
  const check = validate(student, reg.selection)
  const cal = calendarState(now)
  const firstName = student.name.split(' ')[0]
  const news = ANNOUNCEMENTS.filter((a) => !dismissed.includes(a.id))

  let summary
  if (isWeekend) summary = dayBlocks.length ? `Hafta sonu. Pazartesi ${dayBlocks.length} dersin var.` : 'Hafta sonu, ders yok.'
  else if (!dayBlocks.length) summary = 'Bugün dersin yok.'
  else {
    const endOf = (b) => (b.start + b.len - 1) * 60 + 50
    const current = dayBlocks.find((b) => b.start * 60 <= minutesNow && minutesNow <= endOf(b))
    const next = dayBlocks.find((b) => b.start * 60 > minutesNow)
    if (current) summary = `Şu an ${current.code} dersindesin, ${SLOTS[current.start + current.len - 1].end}'da bitiyor.`
    else if (next) summary = `Bugün ${dayBlocks.length} dersin var. Sıradaki ${SLOTS[next.start].start}'ta, ${next.online ? 'uzaktan' : next.room}.`
    else summary = 'Bugünkü derslerin bitti.'
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="muted" style={{ marginTop: 0 }}>Merhaba {firstName}</p>
          <h1>{formatDate(now, { day: 'numeric', month: 'long', weekday: 'long' })}</h1>
          <p>{summary}</p>
        </div>
      </div>

      {reg.status === 'draft' && cal.deadline?.id === 'ekle' && (
        <div className={`callout ${check.errors || !reg.selection.length ? 'red' : 'gold'}`} style={{ marginBottom: 20, alignItems: 'center' }} role="status">
          <Hourglass className="ico" size={20} weight="fill" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>
              {!reg.selection.length
                ? `Henüz ders seçmedin. Ekle-bırak ${relativeDay(cal.deadline.endDate, now)} ${cal.deadline.endTime}'da kapanıyor.`
                : check.errors
                  ? `Kaydında ${check.errors} sorun var. Ekle-bırak ${relativeDay(cal.deadline.endDate, now)} ${cal.deadline.endTime}'da kapanıyor.`
                  : `Kaydın hazır ama kesinleşmedi. Ekle-bırak ${relativeDay(cal.deadline.endDate, now)} ${cal.deadline.endTime}'da kapanıyor.`}
            </strong>
            <p className="small" style={{ marginTop: 2 }}>Kesinleştirmediğin dersler danışmanına gitmez.</p>
          </div>
          <Link className="btn btn-primary btn-sm" to="/kayit">{check.errors ? 'Sorunları çöz' : 'Kayda git'}</Link>
        </div>
      )}

      <div className="grid-2">
        <section className="panel" aria-labelledby="today-h" style={{ alignSelf: 'start' }}>
          <div className="panel-head">
            <h2 id="today-h">{isWeekend ? 'Pazartesi' : 'Bugünün akışı'}</h2>
            <Link to="/program">Haftalık program</Link>
          </div>
          {dayBlocks.length === 0 ? (
            <div className="empty">Bu gün için dersin yok. <Link to="/program">Haftanın tamamını gör</Link>.</div>
          ) : (
            <ol className="timeline">
              {dayBlocks.map((b) => {
                const startMin = b.start * 60
                const endMin = (b.start + b.len - 1) * 60 + 50
                const state = isWeekend ? 'next' : minutesNow > endMin ? 'done' : minutesNow >= startMin ? 'now' : 'next'
                return (
                  <li key={b.id} className={`tl-item ${state} c${colorIndex(b.code)}`}>
                    <span className="tl-time num">{SLOTS[b.start].start}<span className="muted">{SLOTS[b.start + b.len - 1].end}</span></span>
                    <span className="tl-dot" aria-hidden="true" />
                    <div className="tl-body">
                      <div className="tl-title">
                        <span className="code">{b.code}</span> {b.name}
                        {state === 'now' && <span className="badge gold">Şu an</span>}
                        {b.kind === 'U' && <span className="badge">Uygulama</span>}
                        {clashes.has(b.code) && <span className="badge red">Çakışma</span>}
                      </div>
                      <div className="tl-meta small muted">
                        {b.online ? <><MonitorPlay size={14} aria-hidden="true" /> Uzaktan eğitim</> : <><MapPin size={14} aria-hidden="true" /> {b.room}</>}
                        <span>·</span> {b.instructor}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
          {reg.status === 'draft' && reg.selection.length > 0 && (
            <p className="small muted" style={{ marginTop: 12 }}>Program henüz kesinleşmemiş seçimine göre gösteriliyor.</p>
          )}
        </section>

        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          {cal.deadline && (
            <section className="panel deadline" aria-labelledby="dl-h">
              <p className="small muted" id="dl-h">Bitmek üzere</p>
              <h2 style={{ marginTop: 4 }}>{cal.deadline.title}</h2>
              <p className="deadline-when">
                <Clock size={18} aria-hidden="true" />
                <strong>{relativeDay(cal.deadline.endDate, now)}</strong>
                <span className="muted">{formatDate(cal.deadline.endDate, { day: 'numeric', month: 'long', weekday: 'long' })}{cal.deadline.endTime ? `, ${cal.deadline.endTime}` : ''}</span>
              </p>
              {cal.next && (
                <p className="small muted" style={{ marginTop: 10 }}>Sonra: {cal.next.title}, {formatDate(cal.next.startDate)} ({relativeDay(cal.next.startDate, now)})</p>
              )}
            </section>
          )}

          <section className="panel" aria-labelledby="reg-h">
            <div className="panel-head">
              <h2 id="reg-h">Ders kaydın</h2>
              <Link to="/kayit">{reg.status === 'draft' ? 'Kaydı tamamla' : 'Kaydı gör'}</Link>
            </div>
            {reg.status === 'approved' && (
              <div className="callout green"><CheckCircle className="ico" size={20} weight="fill" aria-hidden="true" /><div><strong>Danışman onayladı</strong><p className="small">{reg.selection.length} ders, {selectionEcts(reg.selection)} AKTS</p></div></div>
            )}
            {reg.status === 'finalized' && (
              <div className="callout gold"><Hourglass className="ico" size={20} weight="fill" aria-hidden="true" /><div><strong>Danışman onayı bekleniyor</strong><p className="small">{student.advisor} kaydını inceleyecek.</p></div></div>
            )}
            {reg.status === 'draft' && (
              <div className={`callout ${check.errors ? 'red' : 'gold'}`}>
                <Warning className="ico" size={20} weight="fill" aria-hidden="true" />
                <div>
                  <strong>{reg.selection.length === 0 ? 'Henüz ders seçmedin' : check.errors ? `Kesinleştirmeden önce ${check.errors} sorunu çöz` : 'Seçimin hazır, kesinleştirmeyi unutma'}</strong>
                  <p className="small">Kesinleştirilmeyen dersler danışmana gitmez.</p>
                </div>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="pre-h">
            <div className="panel-head">
              <h2 id="pre-h">Önden seçim</h2>
              <Link to="/onden-secim">{cart.status === 'processed' ? 'Sonucu gör' : 'Sepeti düzenle'}</Link>
            </div>
            {cart.status === 'processed' && cart.result ? (
              <p>{NEXT_TERM.label} için {cart.result.summary.total} dersten {cart.result.summary.got} tanesi alındı.</p>
            ) : (
              <p>{NEXT_TERM.label} kaydı {relativeDay(new Date(NEXT_TERM.opensAt), now)} açılıyor. Sepetinde {cart.items.length} ders ve {cart.items.reduce((n, it) => n + it.backups.length, 0)} yedek var; kayıt anında senin yerine sırayla alınacak.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="st-h">
            <div className="panel-head">
              <h2 id="st-h">Durumun</h2>
              <Link to="/mezuniyet">Mezuniyet</Link>
            </div>
            <div className="standing">
              <Ring value={prog.doneEcts} max={prog.totalEcts} label={`${Math.round((prog.doneEcts / prog.totalEcts) * 100)}%`} sub="mezuniyet" />
              <dl className="stats">
                <div><dt>AGNO</dt><dd className="num">{st.hasHistory ? formatGpa(st.gpa) : '—'}</dd></div>
                <div><dt>Tamamlanan AKTS</dt><dd className="num">{prog.doneEcts}<span className="muted"> / {prog.totalEcts}</span></dd></div>
                <div><dt>Bu dönem</dt><dd className="num">{selectionEcts(reg.selection)} AKTS</dd></div>
              </dl>
            </div>
            {st.probation && <p className="small" style={{ marginTop: 12, color: 'var(--red)' }}>AGNO'n 2,00'ın altında: bu dönem en fazla 32 AKTS alabilirsin ve önce başarısız derslerini almalısın.</p>}
          </section>

          {news.length > 0 && (
            <section className="panel" aria-labelledby="news-h">
              <div className="panel-head"><h2 id="news-h">Duyurular</h2></div>
              <ul className="news">
                {news.map((n) => (
                  <li key={n.id}>
                    <div style={{ flex: 1 }}>
                      <strong>{n.title}</strong>
                      <p className="small muted">{n.body}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm icon-btn" onClick={() => dismiss(n.id)} aria-label={`${n.title} duyurusunu kapat`}><X size={14} /></button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      <p className="visually-hidden">Gün: {DAYS[shownDay]}</p>
    </>
  )
}
