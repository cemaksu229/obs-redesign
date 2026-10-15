import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUp, ArrowDown, Trash, Plus, X, Bell, BellSlash, Lightning, Timer, CheckCircle, XCircle, Warning, Info,
  ArrowCounterClockwise, PencilSimple, MagnifyingGlass, ArrowsClockwise, Lifebuoy,
} from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import WeekGrid from '../components/WeekGrid.jsx'
import { norm } from '../components/CommandPalette.jsx'
import { COURSES, ELECTIVE_GROUPS, DAYS_SHORT, NEXT_TERM, SPRING_SECTIONS } from '../data/catalog.js'
import { blocksFor, conflictCodes, softConflictCodes, timeRange } from '../lib/schedule.js'
import { precheck } from '../lib/precart.js'
import { overlapAllowed } from '../lib/rules.js'
import { notificationSupport, requestNotifications, sendNotification } from '../lib/notify.js'
import { formatDate } from '../lib/dates.js'

const SRC = SPRING_SECTIONS

function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function countdown(target, now) {
  const ms = Math.max(0, target - now)
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return { d, h, m, s: Math.floor((ms % 60000) / 1000), ms }
}

function sectionText(sec) {
  if (!sec.meetings.length) return 'Ders saati yok'
  return sec.meetings.map((m) => `${DAYS_SHORT[m.day]} ${timeRange(m)}`).join(', ')
}

function groupOf(code) {
  return Object.values(ELECTIVE_GROUPS).find((g) => g.pool.includes(code))
}

export default function PreSelect() {
  const { student, cart, setCart, resetCart, runCart, cartTimer, scheduleCart, cancelSchedule } = useApp()
  const now = useNow()
  const opensAt = new Date(NEXT_TERM.opensAt)
  const left = countdown(opensAt, now)
  const [query, setQuery] = useState('')
  const [perm, setPerm] = useState(notificationSupport())
  const check = precheck(student, cart)
  const allowed = overlapAllowed(student)

  const update = (items) => setCart({ ...cart, items, status: 'editing' })
  const move = (i, dir) => {
    const items = [...cart.items]
    const j = i + dir
    if (j < 0 || j >= items.length) return
    ;[items[i], items[j]] = [items[j], items[i]]
    update(items)
  }
  const removeItem = (i) => update(cart.items.filter((_, k) => k !== i))
  const toggleSection = (i, which, no) => {
    const items = cart.items.map((it, k) => {
      if (k !== i) return it
      const patch = (c) => ({ ...c, sections: c.sections.includes(no) ? c.sections.filter((n) => n !== no) : [...c.sections, no] })
      if (which === 'main') return patch(it)
      return { ...it, backups: it.backups.map((b, bi) => (bi === which ? patch(b) : b)) }
    })
    update(items)
  }
  const addBackup = (i, code) => update(cart.items.map((it, k) => (k === i ? { ...it, backups: [...it.backups, { code, sections: [] }] } : it)))
  const removeBackup = (i, bi) => update(cart.items.map((it, k) => (k === i ? { ...it, backups: it.backups.filter((_, x) => x !== bi) } : it)))
  const addItem = (code) => { update([...cart.items, { code, sections: [], backups: [] }]); setQuery('') }

  const inCart = new Set(cart.items.flatMap((it) => [it.code, ...it.backups.map((b) => b.code)]))
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = norm(query)
    return Object.keys(SRC).filter((c) => !inCart.has(c) && norm(`${c} ${COURSES[c].name}`).includes(q)).slice(0, 6)
  }, [query, cart]) // eslint-disable-line react-hooks/exhaustive-deps

  const askPermission = async () => setPerm(await requestNotifications())
  const testNotification = () => sendNotification('Pusula bildirimleri açık', 'Kayıt açıldığında sonucu buraya göndereceğim.', { tag: 'test' })

  const processed = cart.status === 'processed' && cart.result
  const timerLeft = cartTimer ? Math.max(0, Math.ceil((new Date(cartTimer.at) - now) / 1000)) : 0

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Önden seçim</h1>
          <p>Kayıt açıldığında orada olmana gerek yok. Derslerini, şube tercihlerini ve yedeklerini şimdiden sırala. Kayıt açıldığı an Pusula sırayla almaya çalışır, olmazsa yedeğe geçer ve sonucu telefonuna bildirir.</p>
        </div>
      </div>

      <section className="opening" aria-label="Kayıt açılışı">
        <div className="opening-when">
          <p className="small">{NEXT_TERM.label} ders kaydı açılıyor</p>
          <h2>{formatDate(opensAt, { day: 'numeric', month: 'long', weekday: 'long' })}, {opensAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</h2>
        </div>
        <div className="opening-count num" aria-label={`${left.d} gün ${left.h} saat ${left.m} dakika kaldı`}>
          <span><strong>{left.d}</strong> gün</span>
          <span><strong>{String(left.h).padStart(2, '0')}</strong> saat</span>
          <span><strong>{String(left.m).padStart(2, '0')}</strong> dk</span>
        </div>
        <div className="opening-status">
          {processed ? (
            <><CheckCircle size={20} weight="fill" aria-hidden="true" /> İşlendi: {cart.result.summary.got}/{cart.result.summary.total} ders alındı</>
          ) : check.errors ? (
            <><Warning size={20} weight="fill" aria-hidden="true" /> Planında {check.errors} sorun var</>
          ) : (
            <><Lightning size={20} weight="fill" aria-hidden="true" /> Planın hazır, kayıt anında otomatik işlenecek</>
          )}
        </div>
      </section>

      {processed ? (
        <Result result={cart.result} cart={cart} allowed={allowed} onEdit={() => setCart({ ...cart, status: 'editing' })} onReset={resetCart} />
      ) : (
        <div className="reg-layout">
          <div className="reg-picker">
            <section className="panel" aria-labelledby="queue-h">
              <div className="panel-head">
                <h2 id="queue-h">Öncelik sırası</h2>
                <button className="link btn btn-ghost btn-sm" onClick={resetCart}><ArrowCounterClockwise size={14} aria-hidden="true" /> Müfredattan yeniden öner</button>
              </div>
              <p className="small muted" style={{ marginTop: -8, marginBottom: 12 }}>Üstteki ders önce alınır. AKTS sınırına ya da çakışmaya takılırsa sonraki dersler bundan etkilenir, o yüzden en önemlileri yukarı taşı. Şube seçmezsen herhangi bir boş şube alınır.</p>

              {cart.items.length === 0 && <div className="empty">Sepetin boş. Aşağıdan ders ekle.</div>}
              <ol className="queue">
                {cart.items.map((it, i) => {
                  const g = groupOf(it.code)
                  const suggestions = (g ? g.pool : []).filter((c) => SRC[c] && !inCart.has(c))
                  return (
                    <li key={it.code} className="q-item">
                      <div className="q-rank num" aria-hidden="true">{i + 1}</div>
                      <div className="q-body">
                        <div className="q-head">
                          <div>
                            <h3><span className="code">{it.code}</span> {COURSES[it.code].name}</h3>
                            <p className="small muted">{COURSES[it.code].ects} AKTS{g ? ` · ${g.name}` : ' · Zorunlu'}</p>
                          </div>
                          <div className="q-actions">
                            <button className="btn btn-ghost btn-sm icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${it.code} yukarı taşı`}><ArrowUp size={16} /></button>
                            <button className="btn btn-ghost btn-sm icon-btn" onClick={() => move(i, 1)} disabled={i === cart.items.length - 1} aria-label={`${it.code} aşağı taşı`}><ArrowDown size={16} /></button>
                            <button className="btn btn-ghost btn-sm icon-btn" onClick={() => removeItem(i)} aria-label={`${it.code} sepetten çıkar`}><Trash size={16} /></button>
                          </div>
                        </div>
                        <SectionPicker code={it.code} prefs={it.sections} onToggle={(no) => toggleSection(i, 'main', no)} />

                        <div className="backups">
                          {it.backups.map((b, bi) => (
                            <div key={b.code} className="backup">
                              <div className="backup-head">
                                <span className="badge gold"><Lifebuoy size={12} aria-hidden="true" /> {bi + 1}. yedek</span>
                                <span><span className="code">{b.code}</span> {COURSES[b.code].name}</span>
                                <button className="btn btn-ghost btn-sm icon-btn" onClick={() => removeBackup(i, bi)} aria-label={`${b.code} yedeğini çıkar`}><X size={14} /></button>
                              </div>
                              <SectionPicker code={b.code} prefs={b.sections} onToggle={(no) => toggleSection(i, bi, no)} compact />
                            </div>
                          ))}
                          {suggestions.length > 0 && (
                            <label className="add-backup">
                              <span className="small muted">{it.backups.length ? 'Bir yedek daha:' : 'Açılmazsa ya da dolarsa yerine:'}</span>
                              <select className="input" value="" onChange={(e) => e.target.value && addBackup(i, e.target.value)}>
                                <option value="">Yedek ders seç…</option>
                                {suggestions.map((c) => <option key={c} value={c}>{c} {COURSES[c].name}</option>)}
                              </select>
                            </label>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="q-add">
                <label className="search-field">
                  <MagnifyingGlass size={18} aria-hidden="true" />
                  <span className="visually-hidden">Sepete ders ekle</span>
                  <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sepete ders ekle (ör. ENGR 4451)…" autoComplete="off" spellCheck={false} name="sepet-ara" />
                </label>
                {results.length > 0 && (
                  <ul className="picks" style={{ marginTop: 8 }}>
                    {results.map((c) => (
                      <li key={c} className="pick">
                        <div className="pick-main"><span className="code">{c}</span> {COURSES[c].name}<div className="small muted">{COURSES[c].ects} AKTS · {SRC[c].length} şube</div></div>
                        <button className="btn btn-sm" onClick={() => addItem(c)}><Plus size={16} aria-hidden="true" /> Ekle</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <aside className="reg-side" aria-label="Plan kontrolü ve ayarlar">
            <div className="reg-sticky">
              <div className="ects-meter panel">
                <div className="ects-top">
                  <span className="small muted">Ana tercihler</span>
                  <strong className="num">{check.ects}<span className="muted"> / {check.limits.max} AKTS</span></strong>
                </div>
                <div className={`bar ${check.ects > check.limits.max ? 'danger' : check.ects < check.limits.min ? 'warn' : ''}`} aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (check.ects / check.limits.max) * 100)}%` }} />
                </div>
              </div>

              <WeekGrid
                blocks={blocksFor(check.primary, SRC)}
                conflicts={conflictCodes(check.primary, allowed, SRC)}
                softConflicts={softConflictCodes(check.primary, allowed, SRC)}
                showNow={false}
                emptyText="Sepete ders ekledikçe ilk tercihlerinle oluşacak program burada görünür."
              />

              <section className="panel" aria-live="polite">
                <div className="panel-head" style={{ marginBottom: 8 }}><h2>Ön kontrol</h2></div>
                {check.issues.length === 0 ? (
                  <div className="callout green"><CheckCircle className="ico" size={20} weight="fill" aria-hidden="true" /><div><strong>Plan sorunsuz</strong><p className="small">İlk tercihlerin çakışmıyor ve AKTS sınırının içinde.</p></div></div>
                ) : (
                  <ul className="issue-list">
                    {check.issues.map((iss, k) => (
                      <li key={k} className={`issue ${iss.level}`}>
                        {iss.level === 'error' ? <XCircle size={18} weight="fill" aria-hidden="true" /> : iss.level === 'warning' ? <Warning size={18} weight="fill" aria-hidden="true" /> : <Info size={18} weight="fill" aria-hidden="true" />}
                        <div><strong>{iss.title}</strong><p className="small">{iss.detail}</p></div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel settings">
                <div className="panel-head" style={{ marginBottom: 6 }}><h2>Kayıt anında</h2></div>
                <label className="check">
                  <input type="checkbox" checked={cart.autoFinalize} onChange={(e) => setCart({ ...cart, autoFinalize: e.target.checked })} />
                  <span>Alınan dersleri otomatik kesinleştir ve danışmana gönder</span>
                </label>
                <label className="check">
                  <input type="checkbox" checked={cart.notify} onChange={(e) => setCart({ ...cart, notify: e.target.checked })} />
                  <span>Sonucu telefonuma ve bilgisayarıma bildir</span>
                </label>
                <div className="perm small">
                  {perm === 'granted' && <><Bell size={16} weight="fill" aria-hidden="true" /> Bu cihazda bildirimler açık. <button className="link-btn" onClick={testNotification}>Deneme bildirimi gönder</button></>}
                  {perm === 'default' && <><BellSlash size={16} aria-hidden="true" /> Bu cihaz henüz bildirim izni vermedi. <button className="btn btn-sm" onClick={askPermission}>Bildirimlere izin ver</button></>}
                  {perm === 'denied' && <><BellSlash size={16} aria-hidden="true" /> Bildirimler tarayıcı ayarlarından engellenmiş. Site ayarlarından açabilirsin.</>}
                  {perm === 'unsupported' && <><BellSlash size={16} aria-hidden="true" /> Bu tarayıcı bildirimleri desteklemiyor. iPhone'da Pusula'yı ana ekrana ekleyince çalışır.</>}
                </div>
              </section>

              <section className="panel demo-box">
                <p className="small muted" style={{ marginBottom: 10 }}>Demo: kayıt açılışını beklemeden dene.</p>
                <div style={{ display: 'grid', gap: 8 }}>
                  <button className="btn btn-primary" onClick={runCart} disabled={!cart.items.length}><Lightning size={18} weight="fill" aria-hidden="true" /> Kayıt açılışını şimdi simüle et</button>
                  {cartTimer ? (
                    <button className="btn" onClick={cancelSchedule}><Timer size={18} aria-hidden="true" /> {timerLeft} saniye sonra açılıyor · İptal</button>
                  ) : (
                    <button className="btn" onClick={() => scheduleCart(10)} disabled={!cart.items.length}><Timer size={18} aria-hidden="true" /> 10 saniye sonra simüle et</button>
                  )}
                </div>
                {cartTimer && <p className="small muted" style={{ marginTop: 8 }}>Şimdi uygulamayı arka plana al ya da ekranı kilitle. Sonuç bildirim olarak gelecek.</p>}
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

function SectionPicker({ code, prefs, onToggle, compact }) {
  const secs = SRC[code] || []
  if (secs.length <= 1) {
    return <p className={`small ${compact ? 'muted' : ''}`} style={{ marginTop: 6 }}>Tek şube{secs[0] ? `: ${sectionText(secs[0])}` : ''}</p>
  }
  return (
    <div className="sec-pref">
      <span className="small muted">{prefs.length ? 'Şube tercih sırası:' : 'Şube: herhangi biri. Tercih sırası için tıkla:'}</span>
      <div className="sec-chips" role="group" aria-label={`${code} şube tercihleri`}>
        {secs.map((s) => {
          const idx = prefs.indexOf(s.no)
          return (
            <button key={s.no} className={`sec-chip${idx >= 0 ? ' on' : ''}`} aria-pressed={idx >= 0} onClick={() => onToggle(s.no)}>
              {idx >= 0 && <span className="sec-ord num">{idx + 1}</span>}
              <span><strong>Şube {s.no}</strong> <span className="small">{sectionText(s)}</span></span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Result({ result, cart, allowed, onEdit, onReset }) {
  const s = result.summary
  const time = new Date(result.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="reg-layout">
      <div className="reg-picker">
        <section className={`callout ${s.missed ? 'gold' : 'green'}`} aria-live="polite">
          <CheckCircle className="ico" size={22} weight="fill" aria-hidden="true" />
          <div>
            <strong>{s.total} dersten {s.got} tanesi alındı, toplam {result.ects} AKTS</strong>
            <p className="small">
              {[s.viaBackup && `${s.viaBackup} ders yedekten`, s.otherSection && `${s.otherSection} ders başka şubeden`, s.missed && `${s.missed} ders alınamadı`].filter(Boolean).join(', ') || 'Hepsi ilk tercihinle alındı'}.
              {' '}{result.finalized ? 'Kesinleştirildi ve danışmana gönderildi.' : 'Henüz kesinleştirilmedi.'} İşlem saati {time}.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Kayıt anında ne oldu?</h2></div>
          <ol className="log">
            {result.log.map((l) => {
              const tone = !l.result ? 'fail' : l.result.backup || l.attempts.length || l.result.moved?.length ? 'changed' : 'ok'
              return (
                <li key={l.item} className={`log-item ${tone}`}>
                  <span className="log-icon" aria-hidden="true">
                    {tone === 'fail' ? <XCircle size={20} weight="fill" /> : tone === 'changed' ? <ArrowsClockwise size={20} weight="bold" /> : <CheckCircle size={20} weight="fill" />}
                  </span>
                  <div>
                    <p>
                      {l.result ? (
                        <><span className="code">{l.result.code}</span> şube {l.result.no} alındı{l.result.backup ? <span className="badge gold" style={{ marginLeft: 6 }}>{l.item} yerine yedek</span> : null}</>
                      ) : (
                        <><span className="code">{l.item}</span> alınamadı</>
                      )}
                    </p>
                    {l.attempts.length > 0 && (
                      <ul className="attempts small muted">
                        {l.attempts.map((a, k) => <li key={k}>{a.code}{a.no ? ` şube ${a.no}` : ''}: {a.reason}</li>)}
                      </ul>
                    )}
                    {l.result?.moved?.length > 0 && <p className="small" style={{ marginTop: 2 }}>Yer açmak için: {l.result.moved.join(', ')}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={onEdit}><PencilSimple size={18} aria-hidden="true" /> Sepeti düzenle ve tekrar dene</button>
          <button className="btn btn-ghost" onClick={onReset}><ArrowCounterClockwise size={18} aria-hidden="true" /> Baştan başla</button>
        </div>
        <p className="small muted">Bu demoda kayıt anında bir dersin açılmadığı ve bir şubenin hemen dolduğu varsayılıyor; yedeklerin nasıl devreye girdiğini görmek için. Sepette {cart.items.length} ders vardı.</p>
      </div>

      <aside className="reg-side" aria-label="Bahar programı">
        <div className="reg-sticky">
          <div className="panel-head" style={{ marginBottom: 0 }}><h2>{NEXT_TERM.label} programın</h2><Link to="/program">Bu dönemin programı</Link></div>
          <WeekGrid blocks={blocksFor(result.taken, SRC)} conflicts={conflictCodes(result.taken, allowed, SRC)} softConflicts={softConflictCodes(result.taken, allowed, SRC)} showNow={false} />
        </div>
      </aside>
    </div>
  )
}
