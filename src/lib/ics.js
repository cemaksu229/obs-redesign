// Ders programını telefon takvimine aktarmak için .ics dosyası üretir.
import { COURSES, findSection, SLOTS } from '../data/catalog.js'

const TERM_START = new Date('2026-09-21T00:00:00') // Pazartesi
const TERM_END = '20261225T235959'

function pad(n) { return String(n).padStart(2, '0') }
function stamp(d, hhmm) {
  const [h, m] = hhmm.split(':')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${h}${m}00`
}

export function buildIcs(selection, studentName) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pusula//Ders Programi//TR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:Ders programı (${studentName})`]
  for (const { code, no } of selection) {
    const sec = findSection(code, no)
    if (!sec) continue
    sec.meetings.forEach((m, i) => {
      const day = new Date(TERM_START)
      day.setDate(day.getDate() + m.day)
      lines.push(
        'BEGIN:VEVENT',
        `UID:${code.replace(' ', '')}-${no}-${i}@pusula`,
        `DTSTART;TZID=Europe/Istanbul:${stamp(day, SLOTS[m.start].start)}`,
        `DTEND;TZID=Europe/Istanbul:${stamp(day, SLOTS[m.start + m.len - 1].end)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${TERM_END}`,
        `SUMMARY:${code} ${COURSES[code].name}${m.kind === 'U' ? ' (Uygulama)' : ''}`,
        `LOCATION:${m.online ? 'Uzaktan eğitim' : m.room}`,
        `DESCRIPTION:Şube ${no} - ${sec.instructor}`,
        'END:VEVENT',
      )
    })
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(selection, studentName) {
  const blob = new Blob([buildIcs(selection, studentName)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ders-programi.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
