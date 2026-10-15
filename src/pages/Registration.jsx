import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash, Lightning, CheckCircle, Warning, Info, XCircle, Lock, MagnifyingGlass, Hourglass, PaperPlaneTilt } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import WeekGrid from '../components/WeekGrid.jsx'
import { Quota } from './Courses.jsx'
import { norm } from '../components/CommandPalette.jsx'
import { COURSES, SECTIONS, CURRICULA, ELECTIVE_GROUPS, DAYS_SHORT, findSection } from '../data/catalog.js'
import { blocksFor, conflictCodes, solveSections, timeRange, findConflicts } from '../lib/schedule.js'
import { validate, mustRetake, overlapAllowed } from '../lib/rules.js'
import { calendarState, formatDate, relativeDay } from '../lib/dates.js'

const STEPS = ['Dersleri seç', 'Kontrol et', 'Kesinleştir', 'Danışman onayı']

function sectionLabel(sec) {
  if (!sec.meetings.length) return `Şube ${sec.no}`
  return `Şube ${sec.no} · ${sec.meetings.map((m) => `${DAYS_SHORT[m.day]} ${timeRange(m)}`).join(', ')}`
}

export default function Registration() {
  const { student, setRegistration } = useApp()
  const reg = student.registration
  const sel = reg.selection
  const locked = reg.status !== 'draft'
  const [ghost, setGhost] = useState(null)
  const [query, setQuery] = useState('')
  const [solverMsg, setSolverMsg] = useState(null)

  const check = validate(student, sel)
  const clashSet = conflictCodes(sel)
  const selected = new Map(sel.map((s) => [s.code, s.no]))
  const cal = calendarState()
  const addDrop = cal.items.find((e) => e.id === 'ekle')
  const issuesByCode = useMemo(() => {
    const m = new Map()
    check.issues.forEach((i) => (i.codes || []).forEach((c) => { if (!m.has(c) || i.level === 'error') m.set(c, i.level) }))
    return m
  }, [check])

  const setSel = (next) => { setSolverMsg(null); setRegistration({ ...reg, selection: next }) }

  // Yeni eklenen ders için en iyi şube: dolu olmayan ve mevcut programla çakışmayan ilk şube
  const bestSection = (code) => {
    const secs = SECTIONS[code] || []
    return (
      secs.find((s) => s.enrolled < s.capacity && findConflicts([...sel, { code, no: s.no }]).length === 0) ||
      secs.find((s) => s.enrolled < s.capacity) ||
      secs[0]
    )?.no
  }
  const add = (code) => setSel([...sel, { code, no: bestSection(code) }])
  const remove = (code) => setSel(sel.filter((s) => s.code !== code))
  const change = (code, no) => setSel(sel.map((s) => (s.code === code ? { code, no } : s)))

  const autoFix = () => {
    const codes = sel.map((s) => s.code)
    const fixed = Object.fromEntries(sel.filter((s) => s.code.endsWith('4830')).map((s) => [s.code, s.no]))
    const res = solveSections(codes, { fixed, limit: 1, ignore: overlapAllowed(student) })
    if (res.length) {
      const changed = res[0].filter((r) => selected.get(r.code) !== r.no).length
      setRegistration({ ...reg, selection: sel.map((s) => res[0].find((r) => r.code === s.code)) })
      setSolverMsg({ ok: true, text: changed ? `${changed} dersin şubesi değişti. Kalan çakışmalar yalnızca izin verilenler.` : 'Şube değiştirerek çözülebilecek bir çakışma yok.' })
    } else {
      setSolverMsg({ ok: false, text: 'Bu derslerin hiçbir şube kombinasyonu çakışmasız değil. Çakışan derslerden birini bırakman ya da başka bir seçmeli seçmen gerekiyor.' })
    }
  }

  const step = reg.status === 'approved' ? 4 : reg.status === 'finalized' ? 3 : sel.length ? (check.canFinalize ? 2 : 1) : 0

  // Ders listeleri
  const cur = CURRICULA[student.dept]
  const semItems = cur.semesters[student.semester - 1] || []
  const retake = mustRetake(student)
  const thisTerm = semItems.filter((x) => typeof x === 'string' && SECTIONS[x] && !retake.includes(x))
  const groups = [...new Set(semItems.filter((x) => typeof x === 'object').map((x) => x.group))]
  const offered = Object.keys(SECTIONS)
  const searchResults = query.trim()
    ? offered.filter((c) => norm(`${c} ${COURSES[c].name}`).includes(norm(query))).slice(0, 8)
    : []

  const blocks = blocksFor(sel)
  const ghosts = ghost ? blocksFor([ghost]).filter((g) => !(selected.get(g.code) === ghost.no)) : []

  const renderRow = (code, tone) => {
    const isSel = selected.has(code)
    const secs = SECTIONS[code] || []
    const level = issuesByCode.get(code)
    return (
      <li key={code} className={`pick${isSel ? ' is-selected' : ''}${tone ? ` tone-${tone}` : ''}`}>
        <div className="pick-main">
          <div className="pick-title">
            <span className="code">{code}</span> {COURSES[code].name}
            {level === 'error' && isSel && <XCircle size={16} weight="fill" color="var(--red)" aria-label="sorun var" />}
            {clashSet.has(code) && <span className="badge red">Çakışma</span>}
          </div>
          <div className="small muted">{COURSES[code].ects} AKTS{COURSES[code].prereq.length ? ` · Ön koşul: ${COURSES[code].prereq.join(', ')}` : ''}{COURSES[code].distance ? ' · Uzaktan' : ''}</div>
          {isSel && secs.length > 1 && !locked && (
            <label className="pick-sec">
              <span className="visually-hidden">{code} şube seç</span>
              <select className="input" value={selected.get(code)} onChange={(e) => change(code, Number(e.target.value))}>
                {secs.map((s) => (
                  <option key={s.no} value={s.no} disabled={s.enrolled >= s.capacity && s.no !== selected.get(code)}>
                    {sectionLabel(s)}{s.enrolled >= s.capacity ? ' (dolu)' : ` (${s.capacity - s.enrolled} yer)`}
                  </option>
                ))}
              </select>
            </label>
          )}
          {isSel && (secs.length <= 1 || locked) && <div className="small" style={{ marginTop: 4 }}>{sectionLabel(findSection(code, selected.get(code)))}</div>}
          {isSel && <div style={{ marginTop: 6, maxWidth: 220 }}><Quota sec={findSection(code, selected.get(code))} /></div>}
        </div>
        {!locked && (isSel ? (
          <button className="btn btn-sm btn-ghost" onClick={() => remove(code)} aria-label={`${code} dersini çıkar`}><Trash size={16} aria-hidden="true" /> Çıkar</button>
        ) : (
          <button
            className="btn btn-sm"
            onClick={() => add(code)}
            onMouseEnter={() => setGhost({ code, no: bestSection(code) })}
            onMouseLeave={() => setGhost(null)}
            onFocus={() => setGhost({ code, no: bestSection(code) })}
            onBlur={() => setGhost(null)}
            aria-label={`${code} dersini ekle`}
          ><Plus size={16} aria-hidden="true" /> Ekle</button>
        ))}
      </li>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ders kaydı</h1>
          <p>
            {addDrop && new Date() <= addDrop.endDate
              ? <>Ekle-bırak {formatDate(addDrop.endDate, { day: 'numeric', month: 'long' })} {addDrop.endTime}'da kapanıyor ({relativeDay(addDrop.endDate)}).</>
              : 'Kayıt dönemi kapandı.'} Seçtiğin her ders sağdaki programa anında yerleşir.
          </p>
        </div>
      </div>

      <ol className="steps" aria-label="Kayıt adımları">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="step-n num">{i < step ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      {reg.status === 'approved' && (
        <div className="callout green" style={{ marginBottom: 20 }}>
          <Lock className="ico" size={20} weight="fill" aria-hidden="true" />
          <div><strong>Kaydın {student.advisor} tarafından onaylandı</strong><p className="small">Onaydan sonra ders ekleme ve bırakmayı yalnızca danışmanın yapabilir. Bir değişiklik istiyorsan ona yaz.</p></div>
        </div>
      )}
      {reg.status === 'finalized' && (
        <div className="callout gold" style={{ marginBottom: 20 }}>
          <Hourglass className="ico" size={20} weight="fill" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>Kesinleştirdin, danışman onayı bekleniyor</strong>
            <p className="small">Danışmanın onaylamadan önce kesinleştirmeyi geri alıp değişiklik yapabilirsin.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" onClick={() => setRegistration({ ...reg, status: 'draft' })}>Kesinleştirmeyi geri al</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setRegistration({ ...reg, status: 'approved' })}>Demo: danışman onayını simüle et</button>
            </div>
          </div>
        </div>
      )}

      <div className="reg-layout">
        <div className="reg-picker">
          {!locked && retake.length > 0 && (
            <section className="panel">
              <div className="panel-head"><h2>Alttan alman gerekenler</h2></div>
              <p className="small muted" style={{ marginTop: -8, marginBottom: 10 }}>Başarısız olduğun zorunlu dersleri açıldıkları ilk dönemde almalısın.</p>
              <ul className="picks">{retake.map((c) => renderRow(c, 'red'))}</ul>
            </section>
          )}

          <section className="panel">
            <div className="panel-head"><h2>{locked ? 'Kayıtlı derslerin' : `${student.semester}. yarıyıl dersleri`}</h2></div>
            <ul className="picks">
              {locked
                ? sel.map((s) => renderRow(s.code))
                : thisTerm.map((c) => renderRow(c))}
            </ul>
          </section>

          {!locked && groups.map((g) => (
            <section className="panel" key={g}>
              <div className="panel-head"><h2>{ELECTIVE_GROUPS[g].name}</h2><span className="small muted" style={{ marginLeft: 'auto' }}>Bu gruptan bir ders seç</span></div>
              <ul className="picks">{ELECTIVE_GROUPS[g].pool.filter((c) => SECTIONS[c]).map((c) => renderRow(c))}</ul>
            </section>
          ))}

          {!locked && (
            <section className="panel">
              <div className="panel-head"><h2>Başka bir ders ekle</h2></div>
              <label className="search-field">
                <MagnifyingGlass size={18} aria-hidden="true" />
                <span className="visually-hidden">Ders ara</span>
                <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ders kodu ya da adı (ör. CE 4650)…" autoComplete="off" spellCheck={false} name="kayit-ara" />
              </label>
              {searchResults.length > 0 && <ul className="picks" style={{ marginTop: 10 }}>{searchResults.map((c) => renderRow(c))}</ul>}
              {query && searchResults.length === 0 && <p className="small muted" style={{ marginTop: 10 }}>Bu dönem "{query}" ile eşleşen açılmış ders yok.</p>}
              {/* Seçili ama yukarıdaki listelerde görünmeyen dersler (örneğin başka bölümden alınan) */}
              {sel.filter((s) => !thisTerm.includes(s.code) && !retake.includes(s.code) && !groups.some((g) => ELECTIVE_GROUPS[g].pool.includes(s.code))).length > 0 && (
                <>
                  <p className="small muted" style={{ marginTop: 14 }}>Diğer seçtiklerin</p>
                  <ul className="picks">
                    {sel.filter((s) => !thisTerm.includes(s.code) && !retake.includes(s.code) && !groups.some((g) => ELECTIVE_GROUPS[g].pool.includes(s.code))).map((s) => renderRow(s.code))}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="reg-side" aria-label="Program önizleme ve kontrol">
          <div className="reg-sticky">
            <div className="ects-meter panel">
              <div className="ects-top">
                <span className="small muted">Seçili AKTS</span>
                <strong className="num">{check.ects}<span className="muted"> / {check.limits.max}</span></strong>
              </div>
              <div className={`bar ${check.ects > check.limits.max ? 'danger' : check.ects < check.limits.min ? 'warn' : ''}`} aria-hidden="true">
                <span style={{ width: `${Math.min(100, (check.ects / check.limits.max) * 100)}%` }} />
              </div>
              <p className="small muted" style={{ marginTop: 6 }}>{check.limits.reason}. Staj limite dahil değil.</p>
            </div>

            <WeekGrid blocks={blocks} ghosts={ghosts} conflicts={clashSet} showNow={false} emptyText="Ders ekledikçe programın burada oluşacak." />

            {!locked && (
              <div className="issues panel" aria-live="polite">
                <div className="panel-head" style={{ marginBottom: 8 }}>
                  <h2>Kontrol</h2>
                  {check.issues.some((i) => i.level === 'error' && i.title.includes('çakışıyor')) && <button className="btn btn-sm" onClick={autoFix} style={{ marginLeft: 'auto' }}><Lightning size={16} weight="fill" aria-hidden="true" /> Çakışmasız şube bul</button>}
                </div>
                {solverMsg && <div className={`callout ${solverMsg.ok ? 'green' : 'red'} small`} style={{ marginBottom: 10 }}>{solverMsg.text}</div>}
                {sel.length === 0 ? <p className="small muted">Ders seçmeye başladığında kurallar burada anında kontrol edilir.</p>
                  : check.issues.length === 0 ? (
                    <div className="callout green"><CheckCircle className="ico" size={20} weight="fill" aria-hidden="true" /><div><strong>Her şey yolunda</strong><p className="small">Çakışma, kontenjan ve ön koşul sorunu yok.</p></div></div>
                  ) : (
                    <ul className="issue-list">
                      {check.issues.map((i, k) => (
                        <li key={k} className={`issue ${i.level}`}>
                          {i.level === 'error' ? <XCircle size={18} weight="fill" aria-hidden="true" /> : i.level === 'warning' ? <Warning size={18} weight="fill" aria-hidden="true" /> : <Info size={18} weight="fill" aria-hidden="true" />}
                          <div><strong>{i.title}</strong><p className="small">{i.detail}</p></div>
                        </li>
                      ))}
                    </ul>
                  )}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 14 }}
                  disabled={!check.canFinalize}
                  onClick={() => setRegistration({ ...reg, status: 'finalized' })}
                >
                  <PaperPlaneTilt size={18} aria-hidden="true" /> Kesinleştir ve danışmana gönder
                </button>
                {!check.canFinalize && sel.length > 0 && <p className="small muted" style={{ marginTop: 6, textAlign: 'center' }}>Kırmızı işaretli {check.errors} sorunu çözünce kesinleştirebilirsin.</p>}
              </div>
            )}
            {locked && <Link to="/program" className="btn" style={{ width: '100%' }}>Haftalık programa git</Link>}
          </div>
        </aside>
      </div>
    </>
  )
}
