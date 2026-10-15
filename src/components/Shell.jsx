import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, CalendarDots, Books, Exam, GraduationCap, NotePencil, SquaresFour, MagnifyingGlass } from '@phosphor-icons/react'
import { useApp } from '../state/AppState.jsx'
import { TERM } from '../data/catalog.js'
import { validate } from '../lib/rules.js'
import CommandPalette from './CommandPalette.jsx'
import StudentMenu from './StudentMenu.jsx'

export const NAV = [
  { to: '/', label: 'Bugün', icon: Sun, end: true },
  { to: '/program', label: 'Ders programı', short: 'Program', icon: CalendarDots },
  { to: '/kayit', label: 'Ders kaydı', short: 'Kayıt', icon: NotePencil },
  { to: '/dersler', label: 'Açılan dersler', short: 'Dersler', icon: Books },
  { to: '/notlar', label: 'Notlar ve devam', short: 'Notlar', icon: Exam },
  { to: '/mezuniyet', label: 'Mezuniyet', icon: GraduationCap },
]

export function BrandMark(props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 5.5 19.4 16 16 26.5 12.6 16Z" fill="currentColor" opacity="0.25" />
      <path d="M16 5.5 19.4 16h-6.8Z" fill="var(--gold)" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  )
}

export default function Shell() {
  const { student } = useApp()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const reg = student.registration
  const regErrors = reg.status === 'draft' ? validate(student, reg.selection).errors : 0

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="shell">
      <a className="skip-link" href="#main">İçeriğe geç</a>
      <aside className="sidebar" aria-label="Ana menü">
        <NavLink to="/" className="brand">
          <BrandMark className="brand-mark" />
          <span className="brand-name">Pusula<span className="brand-sub">Öğrenci bilgi sistemi</span></span>
        </NavLink>
        <nav style={{ display: 'grid', gap: 4 }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link">
              <Icon size={20} weight="duotone" aria-hidden="true" />
              {label}
              {to === '/kayit' && reg.status === 'draft' && (
                <span className={`badge ${regErrors ? 'red' : 'gold'}`}>{regErrors ? `${regErrors} sorun` : 'Taslak'}</span>
              )}
            </NavLink>
          ))}
          <div className="nav-sep" />
          <NavLink to="/diger" className="nav-link">
            <SquaresFour size={20} weight="duotone" aria-hidden="true" />
            Belgeler ve başvurular
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <p className="small muted" style={{ padding: '0 12px' }}>Kurgusal verilerle hazırlanmış bir yeniden tasarım konseptidir.</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="search-btn" onClick={() => setPaletteOpen(true)} aria-label="Ara: sayfa, ders veya işlem (Ctrl+K)">
            <MagnifyingGlass size={18} aria-hidden="true" />
            <span>Ara: ders, sayfa, işlem</span>
            <span className="kbd">Ctrl K</span>
          </button>
          <span className="term-chip">{TERM.label}</span>
          <div className="topbar-right">
            <StudentMenu />
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1} style={{ outline: 'none' }}>
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Alt menü">
        {NAV.filter((n) => n.to !== '/dersler').map(({ to, label, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={22} weight="duotone" aria-hidden="true" />
            {short || label}
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
