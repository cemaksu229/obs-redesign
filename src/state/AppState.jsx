import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STUDENTS, getStudent } from '../data/students.js'
import { NEXT_TERM } from '../data/catalog.js'
import { defaultCart, simulateOpening, notificationText } from '../lib/precart.js'
import { sendNotification } from '../lib/notify.js'

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
  const [carts, setCarts] = useState(stored.carts || {})
  // Demo: kayıt açılışının birkaç saniye sonra simüle edilmesi (uygulama arka plandayken bildirim görmek için)
  const [cartTimer, setCartTimer] = useState(stored.cartTimer || null)
  const [toast, setToast] = useState(null)
  const [dismissed, setDismissed] = useState(stored.dismissed || [])
  // ?theme=dark|light adresle tema seçmeye izin verir (sunum ve ekran kaydı için)
  const urlTheme = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null
  const [theme, setTheme] = useState(['dark', 'light'].includes(urlTheme) ? urlTheme : stored.theme || 'system')

  useEffect(() => {
    save({ studentId, registrations, carts, cartTimer, dismissed, theme })
  }, [studentId, registrations, carts, cartTimer, dismissed, theme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const cartsRef = useRef(carts)
  cartsRef.current = carts

  // Bir öğrencinin sepetini kayıt açılmış gibi işler, sonucu kaydeder ve bildirir
  const runCart = (id) => {
    const base = getStudent(id)
    const student = { ...base, registration: registrations[id] || base.registration }
    const cart = cartsRef.current[id] || defaultCart(student)
    const result = simulateOpening(student, cart)
    setCarts((c) => ({ ...c, [id]: { ...cart, status: 'processed', result } }))
    const text = notificationText(result, NEXT_TERM.label)
    setToast({ ...text, id: Date.now() })
    if (cart.notify) sendNotification(text.title, text.body, { tag: `kayit-${id}` })
    return result
  }
  const runRef = useRef(runCart)
  runRef.current = runCart

  // Uygulama içi bildirim kartı 15 saniye sonra kendiliğinden kapanır
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 15000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!cartTimer) return
    const left = new Date(cartTimer.at) - Date.now()
    const t = setTimeout(() => {
      setCartTimer(null)
      runRef.current(cartTimer.studentId)
    }, Math.max(0, left))
    return () => clearTimeout(t)
  }, [cartTimer])

  const value = useMemo(() => {
    const base = getStudent(studentId)
    const registration = registrations[base.id] || base.registration
    const student = { ...base, registration }
    return {
      student,
      students: STUDENTS,
      setStudentId,
      setRegistration: (reg) => setRegistrations((r) => ({ ...r, [base.id]: reg })),
      resetRegistration: () => {
        setRegistrations((r) => {
          const next = { ...r }
          delete next[base.id]
          return next
        })
        setCarts((c) => {
          const next = { ...c }
          delete next[base.id]
          return next
        })
        setCartTimer(null)
      },
      cart: carts[base.id] || defaultCart(student),
      setCart: (cart) => setCarts((c) => ({ ...c, [base.id]: cart })),
      resetCart: () => setCarts((c) => ({ ...c, [base.id]: defaultCart(student) })),
      runCart: () => runRef.current(base.id),
      cartTimer: cartTimer && cartTimer.studentId === base.id ? cartTimer : null,
      scheduleCart: (seconds) => setCartTimer({ studentId: base.id, at: new Date(Date.now() + seconds * 1000).toISOString() }),
      cancelSchedule: () => setCartTimer(null),
      toast,
      clearToast: () => setToast(null),
      dismissed,
      dismiss: (id) => setDismissed((d) => [...new Set([...d, id])]),
      theme,
      setTheme,
    }
  }, [studentId, registrations, carts, cartTimer, toast, dismissed, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  return useContext(Ctx)
}
