import { useEffect, useMemo, useState } from 'react'
import { MonitorPlay, Warning } from '@phosphor-icons/react'
import { SLOTS, DAYS, DAYS_SHORT } from '../data/catalog.js'
import { timeRange } from '../lib/schedule.js'
import { hashStr } from '../lib/random.js'

const SLOT_H = 52 // px, bir ders saati

export function colorIndex(code) {
  return hashStr(code) % 8
}

function useNarrow(query = '(max-width: 640px)') {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return m
}

// Aynı günde üst üste binen blokları yan yana şeritlere dağıtır.
function layoutDay(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || b.len - a.len)
  const out = []
  let group = []
  let groupEnd = -1
  const flush = () => {
    const lanes = []
    group.forEach((b) => {
      let lane = lanes.findIndex((end) => end <= b.start)
      if (lane === -1) { lane = lanes.length; lanes.push(0) }
      lanes[lane] = b.start + b.len
      out.push({ ...b, lane })
    })
    out.slice(out.length - group.length).forEach((b) => { b.lanes = lanes.length })
    group = []
  }
  for (const b of sorted) {
    if (b.start >= groupEnd && group.length) flush()
    group.push(b)
    groupEnd = Math.max(groupEnd, b.start + b.len)
  }
  if (group.length) flush()
  return out
}

function nowInfo(now) {
  const day = (now.getDay() + 6) % 7 // Pazartesi = 0
  const minutes = now.getHours() * 60 + now.getMinutes() - (8 * 60 + 40)
  return { day, offset: minutes / 60 }
}

export default function WeekGrid({ blocks, conflicts = new Set(), softConflicts = new Set(), ghosts = [], now = new Date(), showNow = true, onSelect, emptyText }) {
  const narrow = useNarrow()
  const today = nowInfo(now)
  const [mobileDay, setMobileDay] = useState(today.day < 5 ? today.day : 0)

  const all = [...blocks, ...ghosts.map((g) => ({ ...g, ghost: true }))]
  const range = useMemo(() => {
    const used = all.flatMap((b) => [b.start, b.start + b.len - 1])
    const min = Math.min(0, ...used)
    const max = Math.max(8, ...used)
    return { min, max }
  }, [all])
  const rows = SLOTS.slice(range.min, range.max + 1)
  const days = narrow ? [mobileDay] : [0, 1, 2, 3, 4]

  return (
    <div className="week">
      {narrow && (
        <div className="segmented week-days" role="group" aria-label="Gün seç">
          {DAYS_SHORT.map((d, i) => (
            <button key={d} aria-pressed={mobileDay === i} onClick={() => setMobileDay(i)}>
              {d}{i === today.day && <span className="dot" aria-label="bugün" />}
            </button>
          ))}
        </div>
      )}
      <div className="week-grid" style={{ '--cols': days.length, '--slot-h': `${SLOT_H}px` }}>
        <div className="week-corner" />
        {days.map((d) => (
          <div key={d} className={`week-dayhead${d === today.day ? ' is-today' : ''}`}>
            {narrow ? DAYS[d] : DAYS[d]}
          </div>
        ))}
        <div className="week-times" style={{ height: rows.length * SLOT_H }}>
          {rows.map((s) => (
            <div key={s.index} className="week-time" style={{ height: SLOT_H }}>
              <span className="num">{s.start}</span>
            </div>
          ))}
        </div>
        {days.map((d) => {
          const dayBlocks = layoutDay(all.filter((b) => b.day === d))
          return (
            <div key={d} className={`week-col${d === today.day ? ' is-today' : ''}`} style={{ height: rows.length * SLOT_H }}>
              {rows.map((s) => <div key={s.index} className="week-cell" style={{ height: SLOT_H }} />)}
              {dayBlocks.map((b) => {
                const clash = conflicts.has(b.code) && !b.ghost
                const soft = !clash && softConflicts.has(b.code) && !b.ghost
                return (
                  <button
                    type="button"
                    key={b.id}
                    className={`block c${colorIndex(b.code)}${clash ? ' clash' : ''}${soft ? ' soft' : ''}${b.ghost ? ' ghost' : ''}${b.kind === 'U' ? ' lab' : ''}`}
                    style={{
                      top: (b.start - range.min) * SLOT_H + 2,
                      height: b.len * SLOT_H - 4,
                      left: `calc(${(b.lane / b.lanes) * 100}% + 3px)`,
                      width: `calc(${100 / b.lanes}% - 6px)`,
                    }}
                    onClick={() => onSelect?.(b)}
                    tabIndex={onSelect ? 0 : -1}
                    aria-label={`${b.code} ${b.name}, ${DAYS[b.day]} ${timeRange(b)}, ${b.room}${clash ? ', çakışıyor' : soft ? ', izin verilen çakışma' : ''}`}
                  >
                    <span className="block-code">
                      {(clash || soft) && <Warning size={13} weight="fill" aria-hidden="true" />}
                      {b.online && <MonitorPlay size={13} weight="fill" aria-hidden="true" />}
                      {b.code}{b.kind === 'U' ? ' · Lab' : ''}
                    </span>
                    {b.len > 1 && <span className="block-name">{b.name}</span>}
                    <span className="block-meta num">{b.online ? 'Uzaktan' : b.room} · {timeRange(b)}</span>
                  </button>
                )
              })}
              {showNow && d === today.day && today.offset > 0 && today.offset < rows.length && (
                <div className="now-line" style={{ top: (today.offset - range.min) * SLOT_H }} aria-hidden="true">
                  <span>{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {blocks.length === 0 && ghosts.length === 0 && <p className="week-empty muted">{emptyText || 'Henüz ders yok.'}</p>}
    </div>
  )
}
