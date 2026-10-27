import { describe, expect, it } from 'vitest'
import { validateBookingInput, validateBookingInterval } from './bookingRules'

const now = new Date('2029-12-30T00:00:00.000Z')

describe('validateBookingInput', () => {
  it('requires a title', () => {
    expect(validateBookingInput('2030-01-01T09:00', '2030-01-01T09:15', '')).toBe('Enter a booking title.')
  })

  it('accepts a future 15-minute slot', () => {
    expect(validateBookingInput('2030-01-01T09:00', '2030-01-01T10:00', 'Planning', now)).toBeNull()
  })

  it('rejects a booking longer than three hours', () => {
    expect(validateBookingInput('2030-01-01T09:00', '2030-01-01T12:15', 'Planning', now)).toBe('Bookings must be between 15 minutes and 3 hours.')
  })

  it('rejects a booking more than 14 days ahead', () => {
    expect(validateBookingInterval('2030-01-14T09:00', '2030-01-14T10:00', now)).toBe('Bookings can be made up to 14 days ahead.')
  })

  it('rejects times outside 15-minute increments', () => {
    expect(validateBookingInterval('2030-01-01T09:05', '2030-01-01T10:05', now)).toBe('Choose times in 15-minute increments.')
  })
})
