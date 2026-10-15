import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Books, ArrowRight } from '@phosphor-icons/react'
import { NAV } from './Shell.jsx'
import { COURSES, SECTIONS } from '../data/catalog.js'
import { OTHER_GROUPS } from '../data/other.js'

// Türkçe büyük/küçük harf ve aksan farkını yok sayan arama
export function norm(s) {
  return s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const all = useMemo(() => {
    const pages = [...NAV, { to: '/diger', label: 'Belgeler ve başvurular' }].map((n) => ({ kind: 'Sayfa', title: n.label, to: n.to }))
    const other = OTHER_GROUPS.flatMap((g) => g.items.map((i) => ({ kind: g.title, title: i.title, desc: i.desc, to: i.to || `/diger#${i.id}` })))
    const courses = Object.values(COURSES).map((c) => ({
      kind: 'Ders', title: `${c.code} ${c.name}`, desc: SECTIONS[c.code] ? `${SECTIONS[c.code].length} şube açık` : 'Bu dönem açılmadı', to: `/dersler?q=${encodeURIComponent(c.code)}`,
    }))
    return [...pages, ...other, ...courses]
  }, [])

  const results = useMemo(() => {
    if (!q.trim()) return all.filter((x) => x.kind === 'Sayfa')
    const terms = norm(q).split(/\s+/).filter(Boolean)
    return all.filter((x) => terms.every((t) => norm(`${x.title} ${x.desc || ''}`).includes(t))).slice(0, 12)
  }, [q, all])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])
  useEffect(() => setActive(0), [q])

  if (!open) return null

  const go = (item) => {
    onClose()
    navigate(item.to)
  }

  const onKey = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) go(results[active])
  }

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Arama" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ders kodu, ders adı ya da işlem yaz (ör. transkript, MATH 1131)…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Ara"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `pal-${active}` : undefined}
          />
        </div>
        <ul id="palette-list" role="listbox" className="palette-list">
          {results.length === 0 && <li className="empty">"{q}" için sonuç yok. Ders kodunu boşluklu yazmayı dene: EEE 3718.</li>}
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.title}`}
              id={`pal-${i}`}
              role="option"
              aria-selected={i === active}
              className="palette-item"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
            >
              {r.kind === 'Ders' ? <Books size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
              <span className="palette-title">
                {r.title}
                {r.desc && <span className="small muted">{r.desc}</span>}
              </span>
              <span className="badge">{r.kind}</span>
            </li>
          ))}
        </ul>
        <p className="palette-foot small muted">↑↓ ile gez, Enter ile aç, Esc ile kapat</p>
      </div>
    </div>
  )
}
