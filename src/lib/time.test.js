import { afterEach, describe, expect, it, vi } from 'vitest'
import { addMinutesToLocalInput, localInputToIso, nextQuarterHourRange } from './time'

afterEach(() => vi.useRealTimers())

describe('localInputToIso', () => {
  it('interprets the form value in Asia/Kolkata', () => {
    expect(localInputToIso('2026-10-27T09:30')).toBe('2026-10-27T04:00:00.000Z')
  })

  it('adds time while keeping the Asia/Kolkata local value', () => {
    expect(addMinutesToLocalInput('2026-10-27T23:30', 60)).toBe('2026-10-28T00:30')
  })

  it('creates a 15-minute-aligned default range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T03:31:00.000Z'))
    expect(nextQuarterHourRange()).toEqual({ start: '2026-10-27T09:15', end: '2026-10-27T10:15' })
  })
})
