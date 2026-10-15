import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MagnifyingGlass, Plus, Check, MonitorPlay } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import { COURSES, SECTIONS, DEPARTMENTS, DAYS_SHORT, courseDepartments, courseYear, TERM } from '../data/catalog.js'
import { timeRange } from '../lib/schedule.js'
import { norm } from '../components/CommandPalette.jsx'

export function Quota({ sec }) {
  const left = sec.capacity - sec.enrolled
  const pct = (sec.enrolled / sec.capacity) * 100
  const tone = left <= 0 ? 'danger' : pct > 85 ? 'warn' : ''
  return (
    <div className="quota">
      <div className={`bar ${tone}`} aria-hidden="true"><span style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <span className={`small num ${left <= 0 ? '' : 'muted'}`} style={left <= 0 ? { color: 'var(--red)', fontWeight: 600 } : undefined}>
        {left <= 0 ? 'Dolu' : `${left} yer`}
      </span>
    </div>
  )
}

export default function Courses() {
  const { student, setRegistration } = useApp()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [dept, setDept] = useState(params.get('q') ? 'all' : student.dept)
  const [year, setYear] = useState('all')
  const [onlyFree, setOnlyFree] = useState(false)
  const reg = student.registration
  const selected = new Map(reg.selection.map((s) => [s.code, s.no]))

  const list = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean)
    return Object.keys(SECTIONS)
      .map((code) => ({ ...COURSES[code], sections: SECTIONS[code], depts: courseDepartments(code), year: courseYear(code) }))
      .filter((c) => dept === 'all' || c.depts.includes(dept))
      .filter((c) => year === 'all' || c.year === Number(year))
      .filter((c) => !onlyFree || c.sections.some((s) => s.enrolled < s.capacity))
      .filter((c) => terms.every((t) => norm(`${c.code} ${c.name} ${c.sections.map((s) => s.instructor).join(' ')}`).includes(t)))
      .sort((a, b) => a.year - b.year || a.code.localeCompare(b.code))
  }, [q, dept, year, onlyFree])

  const add = (code, no) => {
    const next = reg.selection.filter((s) => s.code !== code)
    next.push({ code, no })
    setRegistration({ ...reg, selection: next })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Açılan dersler</h1>
          <p>{TERM.label} döneminde açılan dersler ve şubeleri. Her şubenin saatini, öğretim elemanını ve kalan kontenjanını burada görürsün.</p>
        </div>
      </div>

      <div className="filters">
        <label className="search-field">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <span className="visually-hidden">Ders ara</span>
          <input className="input" value={q} placeholder="Ders kodu, adı ya da hoca (ör. EEE 3718)…" autoComplete="off" spellCheck={false} name="ders-ara" onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} />
        </label>
        <label>
          <span className="visually-hidden">Bölüm</span>
          <select className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">Tüm bölümler</option>
            {Object.values(DEPARTMENTS).map((d) => <option key={d.code} value={d.code}>{d.name}{d.code === student.dept ? ' (senin bölümün)' : ''}</option>)}
          </select>
        </label>
        <div className="segmented" role="group" aria-label="Sınıf">
          {['all', '1', '2', '3', '4'].map((y) => (
            <button key={y} aria-pressed={year === y} onClick={() => setYear(y)}>{y === 'all' ? 'Tümü' : `${y}. sınıf`}</button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Yalnızca yeri olanlar
        </label>
      </div>

      <p className="small muted" style={{ margin: '0 0 12px' }} aria-live="polite">{list.length} ders</p>

      <div className="course-list">
        {list.length === 0 && <div className="panel empty">Bu filtrelerle eşleşen ders yok. Bölüm filtresini "Tüm bölümler" yapmayı dene.</div>}
        {list.map((c) => (
          <article key={c.code} className="panel course">
            <header className="course-head">
              <div>
                <h3><span className="code">{c.code}</span> {c.name}</h3>
                <p className="small muted">
                  {c.owner} · {c.year}. sınıf · {c.credit} kredi · {c.ects} AKTS
                  {c.prereq.length > 0 && <> · Ön koşul: {c.prereq.join(', ')}</>}
                </p>
              </div>
              <div className="course-tags">
                {c.distance && <span className="badge navy"><MonitorPlay size={12} aria-hidden="true" /> Uzaktan</span>}
                {selected.has(c.code) && <span className="badge green"><Check size={12} aria-hidden="true" /> Seçili, şube {selected.get(c.code)}</span>}
              </div>
            </header>
            <ul className="sections">
              {c.sections.map((s) => (
                <li key={s.no} className="section-row">
                  <span className="sec-no">Şube {s.no}</span>
                  <span className="sec-times num">
                    {s.meetings.length === 0 ? <span className="muted">Ders saati yok</span> : s.meetings.map((m, i) => (
                      <span key={i}>{DAYS_SHORT[m.day]} {timeRange(m)}{m.kind === 'U' ? ' U' : ''}</span>
                    ))}
                  </span>
                  <span className="sec-inst small">{s.instructor}</span>
                  <Quota sec={s} />
                  {reg.status === 'draft' && (
                    selected.get(c.code) === s.no
                      ? <span className="sec-action small muted">Seçili</span>
                      : <button className="btn btn-sm sec-action" onClick={() => add(c.code, s.no)} aria-label={`${c.code} şube ${s.no} kayda ekle`}><Plus size={14} aria-hidden="true" /> Ekle</button>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {reg.status === 'draft' && reg.selection.length > 0 && (
        <div className="sticky-cta">
          <span>{reg.selection.length} ders seçili</span>
          <Link className="btn btn-primary btn-sm" to="/kayit">Kayda git</Link>
        </div>
      )}
    </>
  )
}
