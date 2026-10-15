import { CALENDAR, parseDate } from '../data/calendar.js'

const DAY_MS = 86400000

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function formatDate(d, opts = { day: 'numeric', month: 'long' }) {
  return new Date(d).toLocaleDateString('tr-TR', opts)
}

// "bugün", "yarın", "3 gün sonra"
export function relativeDay(target, now = new Date()) {
  const diff = Math.round((startOfDay(target) - startOfDay(now)) / DAY_MS)
  if (diff === 0) return 'bugün'
  if (diff === 1) return 'yarın'
  if (diff === -1) return 'dün'
  if (diff > 1) return `${diff} gün sonra`
  return `${-diff} gün önce`
}

export function daysUntil(target, now = new Date()) {
  return Math.round((startOfDay(target) - startOfDay(now)) / DAY_MS)
}

// Şu an süren ve yaklaşan takvim etkinlikleri
export function calendarState(now = new Date()) {
  const items = CALENDAR.map((e) => ({
    ...e,
    startDate: parseDate(e.start, '00:00'),
    endDate: parseDate(e.end, e.endTime || '23:59'),
  }))
  const ongoing = items.filter((e) => e.startDate <= now && now <= e.endDate && e.start !== e.end)
  const upcoming = items.filter((e) => e.startDate > now).sort((a, b) => a.startDate - b.startDate)
  const past = items.filter((e) => e.endDate < now)
  // En acil olan: bitmek üzere olan süreç ya da en yakın etkinlik
  const deadline = [...ongoing].sort((a, b) => a.endDate - b.endDate)[0]
  return { items, ongoing, upcoming, past, deadline, next: upcoming[0] }
}
