export const COMPANY_TIMEZONE = 'Asia/Kolkata'

export function toLocalInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce((all, part) => ({ ...all, [part.type]: part.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function nextQuarterHour() {
  const value = new Date()
  value.setSeconds(0, 0)
  value.setMinutes(Math.ceil(value.getMinutes() / 15) * 15)
  return toLocalInputValue(value)
}

export function localInputToIso(value) {
  return new Date(`${value}:00+05:30`).toISOString()
}

export function addMinutesToLocalInput(value, minutes) {
  const date = new Date(localInputToIso(value))
  date.setUTCMinutes(date.getUTCMinutes() + minutes)
  return toLocalInputValue(date)
}

export function nextQuarterHourRange(durationMinutes = 60) {
  const start = nextQuarterHour()
  return { start, end: addMinutesToLocalInput(start, durationMinutes) }
}

export function formatCompanyTime(value) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: COMPANY_TIMEZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function companyDateValue(date = new Date()) {
  return toLocalInputValue(date).slice(0, 10)
}

export function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes) || 0
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder}m`
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}
