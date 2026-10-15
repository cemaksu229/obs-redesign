import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarBlank, Warning, MonitorPlay } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import WeekGrid, { colorIndex } from '../components/WeekGrid.jsx'
import { blocksFor, findConflicts, conflictCodes, timeRange } from '../lib/schedule.js'
import { COURSES, findSection, DAYS_SHORT, TERM } from '../data/catalog.js'
import { selectionEcts, validate } from '../lib/rules.js'
import { downloadIcs } from '../lib/ics.js'

export default function Program() {
  const { student } = useApp()
  const [view, setView] = useState('week')
  const [focus, setFocus] = useState(null)
  const sel = student.registration.selection
  const blocks = blocksFor(sel)
  const conflicts = findConflicts(sel)
  const clashSet = conflictCodes(sel)
  // F ile kalınan dersin çakışmasına kurallar izin veriyor; bunları uyarı olarak göster
  const hardClash = validate(student, sel).issues.some((i) => i.level === 'error' && i.title.includes('çakışıyor'))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ders programı</h1>
          <p>{TERM.label} · {sel.length} ders · {selectionEcts(sel)} AKTS{student.registration.status === 'draft' ? ' · kesinleşmemiş seçim' : ''}</p>
        </div>
        <div className="actions">
          <div className="segmented" role="group" aria-label="Görünüm">
            <button aria-pressed={view === 'week'} onClick={() => setView('week')}>Hafta</button>
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>Liste</button>
          </div>
          <button className="btn" onClick={() => downloadIcs(sel, student.name)} disabled={!sel.length}>
            <CalendarBlank size={18} aria-hidden="true" /> Takvime ekle
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className={`callout ${hardClash ? 'red' : 'gold'}`} style={{ marginBottom: 16 }} role={hardClash ? 'alert' : 'status'}>
          <Warning className="ico" size={20} weight="fill" aria-hidden="true" />
          <div>
            <strong>{conflicts.length === 1 ? 'Programında bir çakışma var' : `Programında ${conflicts.length} çakışma var`}</strong>
            <ul className="small" style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {conflicts.map((c) => <li key={c.a + c.b}>{c.a} ile {c.b}, {c.label}</li>)}
            </ul>
            {!hardClash && <p className="small" style={{ marginTop: 4 }}>F ile kaldığın bir dersin çakışmasına izin var: devam zorunluluğun yok ama sınavlara girmelisin.</p>}
            <Link to="/kayit" className="small" style={{ color: hardClash ? 'var(--red)' : 'inherit', fontWeight: 600 }}>{hardClash ? 'Ders kaydında düzelt' : 'Ders kaydına git'}</Link>
          </div>
        </div>
      )}

      {view === 'week' ? (
        <>
          <WeekGrid blocks={blocks} conflicts={clashSet} onSelect={(b) => setFocus(b.code)} emptyText="Henüz ders seçmedin. Ders kaydından başlayabilirsin." />
          <div className="legend small muted">
            <span><span className="sw" /> Teorik</span>
            <span><span className="sw lab" /> Uygulama / lab</span>
            <span><MonitorPlay size={14} aria-hidden="true" /> Uzaktan</span>
            <span><span className="sw clash" /> Çakışma</span>
          </div>
          {focus && <CourseDetail code={focus} sel={sel} onClose={() => setFocus(null)} />}
        </>
      ) : (
        <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Ders</th><th>Şube</th><th>Saatler</th><th>Derslik</th><th>Öğretim elemanı</th><th className="r">AKTS</th></tr>
            </thead>
            <tbody>
              {sel.map(({ code, no }) => {
                const sec = findSection(code, no)
                return (
                  <tr key={code}>
                    <td><span className={`code c${colorIndex(code)}`} style={{ color: 'var(--c)' }}>{code}</span><div>{COURSES[code].name}</div>{clashSet.has(code) && <span className="badge red">Çakışma</span>}</td>
                    <td className="num">{no}</td>
                    <td className="num">{sec.meetings.length ? sec.meetings.map((m, i) => <div key={i}>{DAYS_SHORT[m.day]} {timeRange(m)}{m.kind === 'U' ? ' (U)' : ''}</div>) : <span className="muted">Saat yok</span>}</td>
                    <td>{sec.meetings[0]?.online ? 'Uzaktan' : [...new Set(sec.meetings.map((m) => m.room))].join(', ') || '—'}</td>
                    <td>{sec.instructor}</td>
                    <td className="r num">{COURSES[code].ects}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CourseDetail({ code, sel, onClose }) {
  const no = sel.find((s) => s.code === code)?.no
  const sec = findSection(code, no)
  const c = COURSES[code]
  return (
    <section className="panel detail" aria-live="polite" style={{ marginTop: 16 }}>
      <div className="panel-head">
        <h2><span className="code">{code}</span> {c.name}</h2>
        <button className="link btn btn-ghost btn-sm" onClick={onClose}>Kapat</button>
      </div>
      <dl className="stats inline">
        <div><dt>Şube</dt><dd>{no}</dd></div>
        <div><dt>Öğretim elemanı</dt><dd>{sec.instructor}</dd></div>
        <div><dt>Kredi / AKTS</dt><dd className="num">{c.credit} / {c.ects}</dd></div>
        <div><dt>Doluluk</dt><dd className="num">{sec.enrolled} / {sec.capacity}</dd></div>
      </dl>
    </section>
  )
}
