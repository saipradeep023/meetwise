import { localInputToIso } from './time'

export function validateBookingInterval(start, end, now = new Date()) {
  const startsAt = new Date(localInputToIso(start))
  const endsAt = new Date(localInputToIso(end))
  const durationMinutes = (endsAt - startsAt) / 60000
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 'Choose valid start and end times.'
  if (startsAt <= now) return 'Choose a future start time.'
  if (startsAt > new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) return 'Bookings can be made up to 14 days ahead.'
  if (endsAt <= startsAt) return 'End time must be after start time.'
  if (durationMinutes < 15 || durationMinutes > 180) return 'Bookings must be between 15 minutes and 3 hours.'
  if (startsAt.getUTCMinutes() % 15 !== 0 || endsAt.getUTCMinutes() % 15 !== 0) return 'Choose times in 15-minute increments.'
  if (start.slice(0, 10) !== end.slice(0, 10)) return 'Start and end must be on the same day.'
  return null
}

export function validateBookingInput(start, end, title, now = new Date()) {
  if (!title.trim()) return 'Enter a booking title.'
  return validateBookingInterval(start, end, now)
}
