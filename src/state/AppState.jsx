import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STUDENTS, getStudent } from '../data/students.js'

const Ctx = createContext(null)
const KEY = 'pusula:v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}
function save(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    // Depolama kapalıysa uygulama yine çalışır, sadece seçimler hatırlanmaz.
  }
}

export function AppStateProvider({ children }) {
  const stored = load()
  const [studentId, setStudentId] = useState(stored.studentId || STUDENTS[0].id)
  const [registrations, setRegistrations] = useState(stored.registrations || {})
  const [dismissed, setDismissed] = useState(stored.dismissed || [])
  const [theme, setTheme] = useState(stored.theme || 'system')

  useEffect(() => {
    save({ studentId, registrations, dismissed, theme })
  }, [studentId, registrations, dismissed, theme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo(() => {
    const base = getStudent(studentId)
    const registration = registrations[base.id] || base.registration
    const student = { ...base, registration }
    return {
      student,
      students: STUDENTS,
      setStudentId,
      setRegistration: (reg) => setRegistrations((r) => ({ ...r, [base.id]: reg })),
      resetRegistration: () => setRegistrations((r) => {
        const next = { ...r }
        delete next[base.id]
        return next
      }),
      dismissed,
      dismiss: (id) => setDismissed((d) => [...new Set([...d, id])]),
      theme,
      setTheme,
    }
  }, [studentId, registrations, dismissed, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  return useContext(Ctx)
}
