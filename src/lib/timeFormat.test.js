import { describe, expect, it } from 'vitest'
import { formatMinutes } from './time'

describe('formatMinutes', () => {
  it('formats booked duration for analytics', () => {
    expect(formatMinutes(135)).toBe('2h 15m')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(0)).toBe('0m')
  })
})
