import { useCallback, useEffect, useState } from 'react'
import { cancelMyBooking, getMyBookings } from '../lib/api'
import { formatCompanyTime } from '../lib/time'
import { useNotice } from '../contexts/NoticeContext'

function roomLabel(booking) {
  const floor = booking.rooms?.floors
  return [floor?.name, floor ? `Level ${floor.level}` : null, booking.rooms?.name].filter(Boolean).join(' · ')
}

function statusClass(status) {
  if (status === 'confirmed') return 'status-free'
  if (status === 'cancelled') return 'status-cancelled'
  if (status === 'ongoing') return 'status-ongoing'
  return 'status-busy'
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const { showNotice } = useNotice()
  const load = useCallback(async () => {
    setLoading(true)
    try { setBookings(await getMyBookings()) }
    catch (error) { showNotice('error', error.message || 'Could not load your bookings.') }
    finally { setLoading(false) }
  }, [showNotice])
  useEffect(() => { load() }, [load])
  const cancel = async (booking) => {
    setCancellingId(booking.id)
    try { await cancelMyBooking(booking.id); showNotice('success', 'Booking cancelled.'); await load() }
    catch (error) { showNotice('error', error.message || 'Could not cancel this booking.') }
    finally { setCancellingId(null) }
  }
  return (
    <section>
      <h1 className="page-title">My Bookings</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">You can cancel any of your own future bookings.</p>
      <div className="mt-6 space-y-3">
        {!loading && !bookings.length && <p className="text-slate-600 dark:text-slate-400">You have no bookings yet.</p>}
        {bookings.map((booking) => {
          const canCancel = booking.status === 'confirmed' && new Date(booking.starts_at) > new Date()
          return (
            <article className="card" key={booking.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{booking.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{roomLabel(booking)}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{formatCompanyTime(booking.starts_at)} – {formatCompanyTime(booking.ends_at)}</p>
                  {booking.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{booking.description}</p>}
                  {booking.cancellation_reason && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Cancellation reason: {booking.cancellation_reason}</p>}
                </div>
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={statusClass(booking.status)}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                  {canCancel && (
                    <button
                      className="button-secondary"
                      onClick={() => cancel(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Cancelling…' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
