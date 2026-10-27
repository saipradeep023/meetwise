import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { cancelBookingAsAdmin, getAdminBookings, getFloorsWithRooms } from '../../lib/api'
import { formatCompanyTime } from '../../lib/time'
import { useNotice } from '../../contexts/NoticeContext'
import MiniCalendar from '../../components/MiniCalendar'

function roomLabel(booking) {
  const floor = booking.rooms?.floors
  return [floor?.name, floor ? `Level ${floor.level}` : null, booking.rooms?.name].filter(Boolean).join(' · ')
}

function getBookingStatus(booking) {
  if (booking.status === 'cancelled') return 'cancelled'
  const now = new Date()
  const start = new Date(booking.starts_at)
  const end = new Date(booking.ends_at)
  if (booking.status === 'confirmed') {
    if (now >= start && now <= end) return 'ongoing'
    return 'confirmed'
  }
  return booking.status
}

function statusBadgeClass(status) {
  if (status === 'confirmed') return 'status-free'
  if (status === 'cancelled') return 'status-cancelled'
  if (status === 'ongoing') return 'status-ongoing'
  return 'status-busy'
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [floors, setFloors] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const { showNotice } = useNotice()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingsData, floorsData] = await Promise.all([
        getAdminBookings(),
        getFloorsWithRooms(),
      ])
      setBookings(bookingsData)
      setFloors(floorsData)
    } catch (error) {
      showNotice('error', error.message || 'Could not load bookings.')
    } finally {
      setLoading(false)
    }
  }, [showNotice])

  useEffect(() => { load() }, [load])

  const availableRooms = useMemo(() => {
    if (!selectedFloorId) {
      return floors.flatMap((f) => (f.rooms || []).map((r) => ({ ...r, floorName: f.name })))
    }
    const floor = floors.find((f) => f.id === selectedFloorId)
    return (floor?.rooms || []).map((r) => ({ ...r, floorName: floor.name }))
  }, [floors, selectedFloorId])

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return bookings.filter((booking) => {
      if (query) {
        const fullName = booking.profiles?.full_name?.toLowerCase() || ''
        const email = booking.profiles?.email?.toLowerCase() || ''
        const title = booking.title?.toLowerCase() || ''
        if (!fullName.includes(query) && !email.includes(query) && !title.includes(query)) {
          return false
        }
      }

      if (selectedFloorId) {
        const floorId = booking.rooms?.floors?.id
        const floorName = booking.rooms?.floors?.name
        const targetFloor = floors.find((f) => f.id === selectedFloorId)
        if (floorId && floorId !== selectedFloorId) return false
        if (!floorId && targetFloor && floorName !== targetFloor.name) return false
      }

      if (selectedRoomId) {
        const roomId = booking.rooms?.id
        const roomName = booking.rooms?.name
        const targetRoom = availableRooms.find((r) => r.id === selectedRoomId)
        if (roomId && roomId !== selectedRoomId) return false
        if (!roomId && targetRoom && roomName !== targetRoom.name) return false
      }

      if (selectedDate) {
        const bookingDate = booking.starts_at.slice(0, 10)
        if (bookingDate !== selectedDate) return false
      }

      return true
    })
  }, [bookings, searchQuery, selectedFloorId, selectedRoomId, selectedDate, floors, availableRooms])

  const handleCancelBooking = async (event) => {
    event.preventDefault()
    if (!cancelReason.trim()) {
      showNotice('error', 'Enter a cancellation reason.')
      return
    }
    setCancelling(true)
    try {
      await cancelBookingAsAdmin(selectedBooking.id, cancelReason.trim())
      setSelectedBooking(null)
      setCancelReason('')
      showNotice('success', 'Booking cancelled and recorded in the audit log.')
      await load()
    } catch (error) {
      showNotice('error', error.message || 'Could not cancel this booking.')
    } finally {
      setCancelling(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedFloorId('')
    setSelectedRoomId('')
    setSelectedDate('')
  }

  const hasActiveFilters = Boolean(searchQuery || selectedFloorId || selectedRoomId || selectedDate)

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">All Bookings</h1>
      <p className="mt-2 text-slate-600">
        Review all employee reservations across floors and rooms. Admin cancellations require a recorded reason.
      </p>

      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredBookings.length}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{bookings.length}</strong> bookings
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold dark:text-teal-400 dark:hover:text-teal-300"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          {!loading && !filteredBookings.length && (
            <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
              No bookings match your selected filters.
            </div>
          )}

          {filteredBookings.map((booking) => {
            const status = getBookingStatus(booking)
            const canCancel = booking.status === 'confirmed' && new Date(booking.starts_at) > new Date()

            return (
              <article className="card p-5" key={booking.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{booking.title}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {booking.profiles?.full_name || 'Unnamed Employee'} ·{' '}
                      <span className="text-slate-500 dark:text-slate-400">{booking.profiles?.email}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roomLabel(booking)}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {formatCompanyTime(booking.starts_at)} – {formatCompanyTime(booking.ends_at)}
                    </p>
                    {booking.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 bg-slate-50 p-2.5 rounded-md dark:bg-slate-800/60 dark:text-slate-300">
                        {booking.description}
                      </p>
                    )}
                    {booking.cancellation_reason && (
                      <p className="mt-3 text-sm text-red-600 bg-red-50 p-2.5 rounded-md dark:bg-red-950/40 dark:text-red-300">
                        <strong>Reason:</strong> {booking.cancellation_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={statusBadgeClass(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {canCancel && (
                      <button
                        type="button"
                        className="button-secondary text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setCancelReason('')
                        }}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="card flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Filter Bookings</h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium dark:text-teal-400 dark:hover:text-teal-300"
                  onClick={resetFilters}
                >
                  Clear All
                </button>
              )}
            </div>

            <label className="block">
              <span className="label text-sm">Search User / Email</span>
              <input
                className="field text-sm mt-1"
                placeholder="Search name, email, title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="label text-sm">Floor</span>
              <select
                className="field text-sm mt-1"
                value={selectedFloorId}
                onChange={(e) => {
                  setSelectedFloorId(e.target.value)
                  setSelectedRoomId('')
                }}
              >
                <option value="">All Floors</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · Level {f.level}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label text-sm">Room</span>
              <select
                className="field text-sm mt-1"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                <option value="">All Rooms</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.floorName})
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="label text-sm mb-0">Date</span>
                {selectedDate && (
                  <button
                    type="button"
                    className="text-xs text-teal-700 hover:underline dark:text-teal-400"
                    onClick={() => setSelectedDate('')}
                  >
                    Show All Dates
                  </button>
                )}
              </div>
              <MiniCalendar
                selectedDate={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate === selectedDate ? '' : newDate)}
              />
              {selectedDate && (
                <p className="mt-2 text-xs text-slate-500 text-center">
                  Filtering by: <strong>{selectedDate}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedBooking &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              className="bg-white rounded-xl p-6 shadow-xl max-w-lg w-full mx-4 space-y-4 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800"
              onSubmit={handleCancelBooking}
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cancel Booking: “{selectedBooking.title}”
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Booking for {selectedBooking.profiles?.full_name || selectedBooking.profiles?.email} in{' '}
                {roomLabel(selectedBooking)}.
              </p>
              <label className="block">
                <span className="label font-medium text-slate-700 dark:text-slate-300">Reason For Cancellation (Required)</span>
                <textarea
                  className="field mt-1 min-h-24"
                  placeholder="Explain why this reservation is being cancelled (saved in audit log)…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength="500"
                  required
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setSelectedBooking(null)
                    setCancelReason('')
                  }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </section>
  )
}
