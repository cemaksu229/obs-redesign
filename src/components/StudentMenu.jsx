import { useEffect, useRef, useState } from 'react'
import { CaretDown, Sun, Moon, Desktop, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import { DEPARTMENTS } from '../data/catalog.js'

function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2)
}

export default function StudentMenu() {
  const { student, students, setStudentId, theme, setTheme, resetRegistration } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className="student-menu" ref={ref}>
      <button className="student-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{initials(student.name)}</span>
        <span className="student-btn-text">
          <strong>{student.name}</strong>
          <span className="small muted">{DEPARTMENTS[student.dept].name}</span>
        </span>
        <CaretDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <p className="menu-label">Demo öğrencisi</p>
          {students.map((s) => (
            <button
              key={s.id}
              role="menuitemradio"
              aria-checked={s.id === student.id}
              className="menu-item"
              onClick={() => { setStudentId(s.id); setOpen(false) }}
            >
              <span className="avatar sm" aria-hidden="true">{initials(s.name)}</span>
              <span>
                {s.name}
                <span className="small muted" style={{ display: 'block' }}>{DEPARTMENTS[s.dept].name} · {Math.ceil(s.semester / 2)}. sınıf</span>
              </span>
            </button>
          ))}
          <div className="nav-sep" />
          <p className="menu-label">Görünüm</p>
          <div className="segmented" style={{ margin: '0 8px 8px' }}>
            {[['light', 'Açık', Sun], ['dark', 'Koyu', Moon], ['system', 'Sistem', Desktop]].map(([v, l, I]) => (
              <button key={v} aria-pressed={theme === v} onClick={() => setTheme(v)}><I size={14} aria-hidden="true" /> {l}</button>
            ))}
          </div>
          <button className="menu-item" onClick={() => { resetRegistration(); setOpen(false) }}>
            <ArrowCounterClockwise size={18} aria-hidden="true" /> Bu öğrencinin kaydını demo başına al
          </button>
        </div>
      )}
    </div>
  )
}
