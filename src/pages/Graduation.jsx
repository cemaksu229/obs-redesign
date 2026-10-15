import { Link } from 'react-router-dom'
import { useApp } from '../state/AppState.jsx'
import { graduationProgress } from '../lib/progress.js'
import { CURRICULA, DEPARTMENTS, ELECTIVE_GROUPS } from '../data/catalog.js'
import Ring from '../components/Ring.jsx'

export default function Graduation() {
  const { student } = useApp()
  const p = graduationProgress(student)
  const cur = CURRICULA[student.dept]
  const current = new Set(student.registration.selection.map((s) => s.code))
  // Bu dönem alınan her seçmeli ders, kendi grubundaki ilk boş yuvaya yerleşir (bir ders tek yuva doldurur)
  const placed = new Map()
  const usedNow = new Set()
  p.slots.forEach((slot) => {
    if (slot.done || slot.type !== 'S') return
    const c = ELECTIVE_GROUPS[slot.group].pool.find((x) => current.has(x) && !usedNow.has(x))
    if (c) { usedNow.add(c); placed.set(slot, c) }
  })
  const currentElective = (slot) => placed.get(slot)
  const semestersLeft = cur.semesters.length - student.semester + 1

  const status = (s) => {
    if (s.done) return 'done'
    if ((s.code && current.has(s.code)) || currentElective(s)) return 'now'
    if (s.failed) return 'failed'
    return 'todo'
  }
  const remaining = p.slots.filter((s) => !s.done)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mezuniyet</h1>
          <p>{cur.name}. {semestersLeft > 0 ? `Normal sürede mezun olmak için ${semestersLeft} dönemin kaldı.` : 'Normal süreni tamamladın.'}</p>
        </div>
      </div>

      <section className="panel rings" aria-label="Mezuniyet özeti">
        <div className="ring-item">
          <Ring value={p.doneEcts} max={p.totalEcts} size={120} label={`${p.doneEcts}`} sub={`/ ${p.totalEcts} AKTS`} />
          <p>Toplam AKTS</p>
        </div>
        <div className="ring-item">
          <Ring value={p.required.done} max={p.required.total} size={120} label={`${p.required.done}`} sub={`/ ${p.required.total} ders`} color="var(--navy)" />
          <p>Zorunlu dersler</p>
        </div>
        <div className="ring-item">
          <Ring value={p.electives.done} max={p.electives.total} size={120} label={`${p.electives.done}`} sub={`/ ${p.electives.total} ders`} color="var(--gold)" />
          <p>Seçmeli dersler</p>
        </div>
        <div className="ring-item">
          <Ring value={p.internship.days} max={p.internship.required} size={120} label={`${p.internship.days}`} sub={`/ ${p.internship.required} gün`} color="var(--green)" />
          <p>Staj</p>
        </div>
      </section>

      {p.failed.length > 0 && (
        <div className="callout red" style={{ marginTop: 20 }}>
          <div>
            <strong>Tekrar alman gereken {p.failed.length} zorunlu ders var</strong>
            <p className="small">{p.failed.map((f) => `${f.code} (${f.letter})`).join(', ')}. Başarısız zorunlu dersler açıldıkları ilk dönemde tekrar alınmalı.</p>
          </div>
        </div>
      )}

      <section style={{ marginTop: 28 }} aria-labelledby="map-h">
        <div className="panel-head">
          <h2 id="map-h">Müfredat haritası</h2>
          <div className="legend small muted" style={{ margin: 0, marginLeft: 'auto' }}>
            <span><span className="sw st-done" /> Tamamlandı</span>
            <span><span className="sw st-now" /> Bu dönem</span>
            <span><span className="sw st-failed" /> Tekrar alınmalı</span>
            <span><span className="sw st-todo" /> Alınmadı</span>
          </div>
        </div>
        <div className="curriculum">
          {cur.semesters.map((sem, i) => {
            const slots = p.slots.filter((s) => s.semester === i + 1)
            const ects = slots.reduce((a, s) => a + s.ects, 0)
            return (
              <div key={i} className={`cur-col${i + 1 === student.semester ? ' is-current' : ''}`}>
                <div className="cur-head">
                  <strong>{i + 1}. yarıyıl</strong>
                  <span className="small muted">{Math.ceil((i + 1) / 2)}. sınıf {i % 2 === 0 ? 'güz' : 'bahar'} · {ects} AKTS</span>
                </div>
                <ul>
                  {slots.map((s, j) => {
                    const st = status(s)
                    const elec = currentElective(s)
                    return (
                      <li key={j} className={`cur-chip st-${st}`} title={s.type === 'S' ? s.groupName : undefined}>
                        <span className="code">{s.code || elec || 'Seçmeli'}</span>
                        <span className="cur-name">{elec ? `${s.groupName}` : s.name}</span>
                        {s.letter && <span className="cur-letter num">{s.letter}</span>}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 28 }} aria-labelledby="rem-h">
        <div className="panel-head">
          <h2 id="rem-h">Kalan dersler</h2>
          <Link to="/dersler">Açılan derslere bak</Link>
        </div>
        {remaining.length === 0 ? <p>Tüm müfredatı tamamladın.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Ders</th><th>Tür</th><th>Yarıyıl</th><th className="r">AKTS</th><th>Durum</th></tr></thead>
              <tbody>
                {remaining.map((s, i) => {
                  const st = status(s)
                  return (
                    <tr key={i}>
                      <td>{s.code ? <><span className="code">{s.code}</span> {s.name}</> : <>{s.groupName} <span className="small muted">({ELECTIVE_GROUPS[s.group].pool.length} dersten biri)</span></>}</td>
                      <td>{s.type === 'Z' ? 'Zorunlu' : 'Seçmeli'}</td>
                      <td className="num">{s.semester}</td>
                      <td className="r num">{s.ects}</td>
                      <td>
                        {st === 'now' && <span className="badge navy">Bu dönem alıyorsun</span>}
                        {st === 'failed' && <span className="badge red">{s.letter} ile kaldın</span>}
                        {st === 'todo' && <span className="badge">Alınmadı</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="small muted" style={{ marginTop: 16 }}>{DEPARTMENTS[student.dept].faculty}, {DEPARTMENTS[student.dept].name}. Danışman: {student.advisor}.</p>
    </>
  )
}
