import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AvailabilityPage from './AvailabilityPage'

const api = vi.hoisted(() => ({
  createBooking: vi.fn(),
  getAvailability: vi.fn(),
  getFloorsWithRooms: vi.fn(),
}))
const notices = vi.hoisted(() => ({ showNotice: vi.fn(), clearNotice: vi.fn(), notice: null }))

vi.mock('../lib/api', () => api)
vi.mock('../contexts/NoticeContext', () => ({
  useNotice: () => notices,
}))

describe('AvailabilityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-27T08:00:00+05:30'))
    api.getFloorsWithRooms.mockResolvedValue([{ id: 'floor-1', name: 'Main floor', level: 1, active: true }])
    api.getAvailability.mockResolvedValue([{
      room_id: 'room-1',
      room_name: 'Focus room',
      floor_name: 'Main floor',
      floor_level: 1,
      capacity: 6,
      is_available: true,
    }])
    api.createBooking.mockResolvedValue('booking-1')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('books an available room and refreshes availability', async () => {
    render(<AvailabilityPage />)

    fireEvent.click(await screen.findByRole('button', { name: /book room/i }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Daily check-in' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

    await waitFor(() => expect(api.createBooking).toHaveBeenCalledWith(expect.objectContaining({
      roomId: 'room-1',
      title: 'Daily check-in',
    })))
    expect(notices.showNotice).toHaveBeenCalledWith('success', 'Room booked. Availability has been refreshed.')
    await waitFor(() => expect(api.getAvailability).toHaveBeenCalledTimes(2))
  })
})
