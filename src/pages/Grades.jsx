import { useMemo, useState } from 'react'
import { useApp } from '../state/AppState.jsx'
import { COURSES, findSection, TERM } from '../data/catalog.js'
import { allRecords, termGpa } from '../lib/progress.js'
import { gpa, formatGpa, FAILING, LETTER_POINTS } from '../lib/grades.js'

function absenceLimit(code, no) {
  const sec = findSection(code, no)
  if (!sec || !sec.meetings.length || sec.meetings[0].online) return null
  const weekly = sec.meetings.reduce((s, m) => s + m.len, 0)
  return Math.floor(weekly * 14 * 0.3)
}

function letterClass(l) {
  if (!l) return ''
  if (FAILING.has(l)) return 'red'
  if (l.startsWith('A')) return 'green'
  if (l.startsWith('D') || l === 'C-') return 'gold'
  return ''
}

export default function Grades() {
  const { student } = useApp()
  const [tab, setTab] = useState('term')
  const sel = student.registration.selection
  const hasHistory = student.transcript.length > 0

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Notlar ve devam</h1>
          <p>Bu dönemki notların ve devamsızlığın, geçmiş dönemlerin transkripti ve "bu notları alırsam ortalamam ne olur" hesabı.</p>
        </div>
        <div className="actions">
          <div className="segmented" role="tablist" aria-label="Bölüm">
            <button role="tab" aria-pressed={tab === 'term'} aria-selected={tab === 'term'} onClick={() => setTab('term')}>Bu dönem</button>
            <button role="tab" aria-pressed={tab === 'transcript'} aria-selected={tab === 'transcript'} onClick={() => setTab('transcript')}>Transkript</button>
            <button role="tab" aria-pressed={tab === 'whatif'} aria-selected={tab === 'whatif'} onClick={() => setTab('whatif')}>Senaryo</button>
          </div>
        </div>
      </div>

      {tab === 'term' && (
        <div className="term-grid">
          {sel.length === 0 && <div className="panel empty">Bu dönem kayıtlı dersin yok.</div>}
          {sel.map(({ code, no }) => {
            const items = student.midterms[code] || []
            const absent = student.absences[code] || 0
            const limit = absenceLimit(code, no)
            const weight = items.reduce((s, i) => s + i.weight, 0)
            const avg = weight ? items.reduce((s, i) => s + i.score * i.weight, 0) / weight : null
            const ratio = limit ? absent / limit : 0
            return (
              <article key={code} className="panel grade-card">
                <h3><span className="code">{code}</span> {COURSES[code].name}</h3>
                {items.length === 0 ? (
                  <p className="small muted" style={{ marginTop: 8 }}>Henüz not girilmedi.</p>
                ) : (
                  <table className="table compact" style={{ marginTop: 8 }}>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.name}><td>{i.name}</td><td className="muted small">%{i.weight}</td><td className="r num"><strong>{i.score}</strong></td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {avg !== null && <p className="small" style={{ marginTop: 6 }}>Şimdiye kadar <strong className="num">{avg.toFixed(1).replace('.', ',')}</strong> ortalama (notun %{weight}'i açıklandı)</p>}
                <div className="absence">
                  <div className="absence-row small">
                    <span>Devamsızlık</span>
                    <span className="num">{limit === null ? 'Devam zorunluluğu yok' : `${absent} / ${limit} saat`}</span>
                  </div>
                  {limit !== null && (
                    <div className={`bar ${ratio >= 0.8 ? 'danger' : ratio >= 0.5 ? 'warn' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={absent} aria-label={`${code} devamsızlık`}>
                      <span style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                    </div>
                  )}
                  {limit !== null && ratio >= 0.5 && <p className="small" style={{ color: ratio >= 0.8 ? 'var(--red)' : 'inherit', marginTop: 4 }}>{limit - absent} saat hakkın kaldı. Sınırı aşarsan NA ile kalırsın.</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {tab === 'transcript' && (
        !hasHistory ? <div className="panel empty">İlk dönemindesin. Notların dönem sonunda burada görünecek.</div> : <Transcript student={student} />
      )}

      {tab === 'whatif' && <WhatIf student={student} />}
    </>
  )
}

function Transcript({ student }) {
  // Her dönemin sonundaki AGNO, o döneme kadarki tüm kayıtlarla hesaplanır. En yeni dönem üstte.
  const rows = student.transcript.map((t, i) => ({
    t,
    ag: gpa(student.transcript.slice(0, i + 1).flatMap((x) => x.records)),
  })).reverse()
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {rows.map(({ t, ag }) => (
        <section key={t.label} className="panel" style={{ padding: 0 }}>
          <div className="panel-head" style={{ padding: '16px 20px 0' }}>
            <h2>{t.label}</h2>
            <span className="small muted num" style={{ marginLeft: 'auto' }}>DNO <strong style={{ color: 'var(--ink)' }}>{formatGpa(termGpa(t))}</strong> · AGNO <strong style={{ color: 'var(--ink)' }}>{formatGpa(ag)}</strong></span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Ders</th><th className="r">AKTS</th><th className="r">Not</th></tr></thead>
              <tbody>
                {t.records.map((r) => (
                  <tr key={r.code}>
                    <td><span className="code">{r.code}</span> {r.name}</td>
                    <td className="r num">{r.ects}</td>
                    <td className="r"><span className={`badge ${letterClass(r.letter)}`}>{r.letter}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

const LETTERS = Object.keys(LETTER_POINTS).filter((l) => l !== 'NA')

function WhatIf({ student }) {
  const sel = student.registration.selection.filter((s) => !s.code.endsWith('4830'))
  const [guess, setGuess] = useState(() => Object.fromEntries(sel.map((s) => [s.code, 'B'])))
  const history = allRecords(student)
  const now = gpa(history)
  const projected = useMemo(() => {
    const extra = sel.map((s) => ({ code: s.code, ects: COURSES[s.code].ects, letter: guess[s.code] || 'B' }))
    return { term: gpa(extra), total: gpa([...history, ...extra]) }
  }, [guess, sel, history])
  const diff = projected.total - now

  return (
    <div className="grid-2">
      <section className="panel">
        <div className="panel-head"><h2>Bu dönem hangi notları bekliyorsun?</h2></div>
        <ul className="whatif">
          {sel.map((s) => (
            <li key={s.code}>
              <span><span className="code">{s.code}</span> <span className="small muted">{COURSES[s.code].ects} AKTS</span><br />{COURSES[s.code].name}</span>
              <select className="input" value={guess[s.code]} onChange={(e) => setGuess({ ...guess, [s.code]: e.target.value })} aria-label={`${s.code} beklenen not`}>
                {LETTERS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </li>
          ))}
        </ul>
        {student.transcript.length > 0 && <p className="small muted" style={{ marginTop: 12 }}>Daha önce aldığın bir dersi tekrar ediyorsan, ortalamaya yeni not girer.</p>}
      </section>
      <section className="panel whatif-result" aria-live="polite">
        <p className="small muted">{TERM.label} sonunda</p>
        <div className="big-num num">{formatGpa(projected.total)}</div>
        <p>AGNO {student.transcript.length ? <>şu an <strong className="num">{formatGpa(now)}</strong>, {diff >= 0 ? 'yükselir' : 'düşer'} <strong className="num" style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>{diff >= 0 ? '+' : ''}{diff.toFixed(2).replace('.', ',')}</strong></> : 'ilk dönem ortalaman olur'}</p>
        <p className="small muted" style={{ marginTop: 8 }}>Dönem ortalaması: <span className="num">{formatGpa(projected.term)}</span></p>
        {projected.total < 2 && <p className="small" style={{ color: 'var(--red)', marginTop: 8 }}>2,00'ın altında kalırsan sınamalı duruma düşersin: en fazla 32 AKTS ve üst sınıf dersi yok.</p>}
      </section>
    </div>
  )
}
