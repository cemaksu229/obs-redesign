import { useMemo, useState } from 'react'
import { Sparkle, CheckCircle, Warning, X, ArrowRight } from '@phosphor-icons/react'
import { DAYS, DAYS_SHORT, SLOTS, SECTIONS, COURSES } from '../data/catalog.js'
import { DEFAULT_PREFS, parsePrefs, generatePlans } from '../lib/planner.js'
import { colorIndex } from './WeekGrid.jsx'

const EXAMPLES = ['Cuma boş olsun', "10'dan önce ders istemiyorum", 'Arada boşluk az olsun', 'Derslerimi az güne topla']

// Küçük haftalık önizleme: her gün bir sütun, her ders saati bir hücre
function MiniWeek({ selection, freeDays }) {
  const cells = {}
  for (const { code, no } of selection) {
    const sec = (SECTIONS[code] || []).find((s) => s.no === no)
    sec?.meetings.forEach((m) => {
      for (let s = m.start; s < m.start + m.len; s++) {
        const k = `${m.day}-${s}`
        cells[k] = cells[k] ? 'clash' : { code, online: m.online }
      }
    })
  }
  const rows = SLOTS.slice(0, 12)
  return (
    <div className="mini-week" aria-hidden="true">
      <span />
      {DAYS_SHORT.map((d, i) => <span key={d} className={`mini-day${freeDays.includes(i) ? ' free' : ''}`}>{d}</span>)}
      {rows.map((r) => (
        <div key={r.index} style={{ display: 'contents' }}>
          <span className="mini-time num">{r.index % 2 === 0 ? r.start : ''}</span>
          {[0, 1, 2, 3, 4].map((d) => {
            const c = cells[`${d}-${r.index}`]
            return <span key={d} className={`mini-cell${c === 'clash' ? ' clash' : c ? ` on c${colorIndex(c.code)}` : ''}`} />
          })}
        </div>
      ))}
    </div>
  )
}

export default function Planner({ selection, ignore, onApply, onClose }) {
  const [text, setText] = useState('')
  const [manual, setManual] = useState(DEFAULT_PREFS)
  const parsed = useMemo(() => parsePrefs(text, manual), [text, manual])
  const prefs = parsed.prefs
  const codes = selection.map((s) => s.code)
  const result = useMemo(() => generatePlans(codes, prefs, { current: selection, ignore }), [codes.join('|'), prefs, selection, ignore]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (d) => setManual((m) => ({ ...m, freeDays: m.freeDays.includes(d) ? m.freeDays.filter((x) => x !== d) : [...m.freeDays, d] }))
  const applyText = () => {
    // Yazıdan anlaşılan tercihleri butonlara aktar, böylece kullanıcı düzeltebilir
    setManual(parsed.prefs)
    setText('')
  }

  return (
    <section className="panel planner" aria-labelledby="planner-h">
      <div className="panel-head">
        <h2 id="planner-h"><Sparkle size={20} weight="fill" aria-hidden="true" style={{ verticalAlign: '-3px', color: 'var(--gold)' }} /> Tercihlerime göre program öner</h2>
        <button className="btn btn-ghost btn-sm icon-btn" onClick={onClose} aria-label="Program önericiyi kapat" style={{ marginLeft: 'auto' }}><X size={18} /></button>
      </div>
      <p className="small muted" style={{ marginTop: -6, marginBottom: 12 }}>Seçtiğin {codes.length} dersin tüm şube kombinasyonlarını deniyorum. Nasıl bir hafta istediğini yaz ya da aşağıdan seç.</p>

      <div className="planner-input">
        <label className="visually-hidden" htmlFor="planner-text">Tercihlerini yaz</label>
        <input
          id="planner-text"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && parsed.found.length) applyText() }}
          placeholder="Ör. cuma boş olsun, 10'dan önce ders istemiyorum…"
          autoComplete="off"
        />
        <div className="planner-examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip-btn" onClick={() => setText((t) => (t ? `${t}, ${ex.toLowerCase()}` : ex))}>{ex}</button>
          ))}
        </div>
        {text && (
          <p className="small understood" aria-live="polite">
            {parsed.found.length ? <>Anladığım: {parsed.found.map((f) => <span key={f} className="badge navy">{f}</span>)} <button className="link-btn" onClick={applyText}>Tercihlere ekle</button></> : 'Henüz bir tercih anlayamadım. Gün adı, saat ya da "boşluk az" gibi ifadeler dene.'}
          </p>
        )}
      </div>

      <div className="planner-controls">
        <div>
          <span className="small muted">Boş kalsın</span>
          <div className="segmented" role="group" aria-label="Boş kalmasını istediğin günler">
            {DAYS_SHORT.map((d, i) => <button key={d} aria-pressed={prefs.freeDays.includes(i)} onClick={() => toggleDay(i)}>{d}</button>)}
          </div>
        </div>
        <label>
          <span className="small muted">En erken</span>
          <select className="input" value={prefs.notBefore} onChange={(e) => setManual((m) => ({ ...m, notBefore: Number(e.target.value) }))}>
            {SLOTS.slice(0, 6).map((s) => <option key={s.index} value={s.index}>{s.start}</option>)}
          </select>
        </label>
        <label>
          <span className="small muted">En geç</span>
          <select className="input" value={prefs.notAfter} onChange={(e) => setManual((m) => ({ ...m, notAfter: Number(e.target.value) }))}>
            {SLOTS.slice(5).map((s) => <option key={s.index} value={s.index}>{s.end}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={prefs.fewGaps} onChange={(e) => setManual((m) => ({ ...m, fewGaps: e.target.checked }))} /> Arada az boşluk</label>
        <label className="check"><input type="checkbox" checked={prefs.fewDays} onChange={(e) => setManual((m) => ({ ...m, fewDays: e.target.checked }))} /> Az güne topla</label>
      </div>

      <p className="small muted" aria-live="polite" style={{ margin: '14px 0 10px' }}>
        {result.total} çakışmasız kombinasyon bulundu{result.plans.length ? `, en uygun ${result.plans.length} tanesi:` : '.'}
        {result.unavailable.length > 0 && ` ${result.unavailable.join(', ')} için boş şube yok, hesaba katılmadı.`}
        {' '}Uzaktan dersler saat tercihlerine dahil değil.
      </p>

      {result.blockers.length > 0 && (
        <div className="callout gold small" style={{ marginBottom: 12 }}>
          <Warning className="ico" size={18} weight="fill" aria-hidden="true" />
          <div>
            {result.blockers.map((b) => (
              <p key={b.day}><strong>{DAYS[b.day]} boş kalamaz:</strong> {b.codes.join(', ')} dersinin açık olan her şubesinde {DAYS[b.day].toLocaleLowerCase('tr')} günü ders var. En az saate indiren programlar üstte.</p>
            ))}
          </div>
        </div>
      )}

      {result.plans.length === 0 ? (
        <div className="callout red"><Warning className="ico" size={20} weight="fill" aria-hidden="true" /><div><strong>Bu derslerle çakışmasız bir program yok</strong><p className="small">Çakışan derslerden birini çıkar ya da başka bir seçmeli dene.</p></div></div>
      ) : (
        <ol className="plans">
          {result.plans.map((p, i) => {
            const perfect = p.violations.length === 0
            return (
              <li key={i} className={`plan${i === 0 ? ' best' : ''}`}>
                <div className="plan-head">
                  <strong>{i === 0 ? 'En uygun' : `Seçenek ${i + 1}`}</strong>
                  {p.criteria.length > 0 ? (
                    <span className={`badge ${perfect ? 'green' : 'gold'}`}>{p.criteria.filter((c) => c.ok).length}/{p.criteria.length} tercih</span>
                  ) : (
                    <span className="badge">{p.gapHours} saat boşluk</span>
                  )}
                </div>
                <MiniWeek selection={p.selection} freeDays={p.freeDays} />
                <ul className="plan-facts small">
                  <li>{p.freeDays.length ? `Boş: ${p.freeDays.map((d) => DAYS[d]).join(', ')}` : 'Her gün ders var'}</li>
                  <li>{p.earliest !== null ? `En erken ${SLOTS[p.earliest].start}, en geç ${SLOTS[p.latest].end}` : 'Kampüste ders yok'}</li>
                  <li>Haftalık boşluk {p.gapHours} saat</li>
                </ul>
                {perfect ? (
                  <p className="small plan-ok"><CheckCircle size={14} weight="fill" aria-hidden="true" /> Tüm tercihlerine uyuyor</p>
                ) : (
                  <ul className="plan-miss small">{p.violations.slice(0, 3).map((v) => <li key={v.text}>{v.text}</li>)}</ul>
                )}
                <p className="small muted plan-changes">
                  {p.changes.length ? `Değişen şubeler: ${p.changes.map((c) => `${c.code} → ${c.no}`).join(', ')}` : 'Şu anki seçiminle aynı şubeler'}
                </p>
                <button className={`btn btn-sm ${i === 0 ? 'btn-primary' : ''}`} disabled={!p.changes.length} onClick={() => onApply(p.selection)}>
                  {p.changes.length ? <>Bu programı uygula <ArrowRight size={14} aria-hidden="true" /></> : 'Zaten bu program'}
                </button>
              </li>
            )
          })}
        </ol>
      )}
      <p className="small muted" style={{ marginTop: 12 }}>
        {COURSES[codes[0]] ? 'Öneriler yalnızca şube değiştirir; ders eklemez ya da çıkarmaz.' : ''}
      </p>
    </section>
  )
}
