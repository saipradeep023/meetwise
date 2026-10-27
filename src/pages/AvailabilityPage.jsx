import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createBooking, getAvailability, getFloorsWithRooms } from '../lib/api'
import { addMinutesToLocalInput, localInputToIso } from '../lib/time'
import { useNotice } from '../contexts/NoticeContext'
import { validateBookingInput, validateBookingInterval } from '../lib/bookingRules'
import MiniCalendar from '../components/MiniCalendar'
import { COMPANY_TIMEZONE } from '../lib/time'

function getCompanyToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}`
}

export default function AvailabilityPage() {
  const [floors, setFloors] = useState([])
  const [floorId, setFloorId] = useState('')
  const [selectedDate, setSelectedDate] = useState(getCompanyToday)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const [bookingRoom, setBookingRoom] = useState(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDescription, setModalDescription] = useState('')
  const [modalStartTime, setModalStartTime] = useState('12:00')
  const [modalEndTime, setModalEndTime] = useState('13:00')
  const [modalError, setModalError] = useState('')
  const [bookingInProgress, setBookingInProgress] = useState(false)

  const { showNotice } = useNotice()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const startIso = localInputToIso(`${selectedDate}T12:00`)
      const endIso = localInputToIso(`${selectedDate}T13:00`)
      const data = await getAvailability(startIso, endIso, floorId)
      setResults(data)
    } catch (error) {
      showNotice('error', error.message || 'Could not refresh availability.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, floorId, showNotice])

  useEffect(() => {
    getFloorsWithRooms()
      .then(setFloors)
      .catch((error) => showNotice('error', error.message))
  }, [showNotice])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenBooking = (room) => {
    setBookingRoom(room)
    setModalTitle('')
    setModalDescription('')
    setModalStartTime('12:00')
    setModalEndTime('13:00')
    setModalError('')
  }

  const handleModalStartTimeChange = (timeStr) => {
    setModalStartTime(timeStr)
    const startDateTime = `${selectedDate}T${timeStr}`
    const endDateTime = `${selectedDate}T${modalEndTime}`
    if (new Date(localInputToIso(endDateTime)) <= new Date(localInputToIso(startDateTime))) {
      const advanced = addMinutesToLocalInput(startDateTime, 60).slice(11)
      setModalEndTime(advanced)
    }
    setModalError('')
  }

  const handleModalEndTimeChange = (timeStr) => {
    setModalEndTime(timeStr)
    setModalError('')
  }

  const handleConfirmBooking = async (event) => {
    event.preventDefault()
    const fullStart = `${selectedDate}T${modalStartTime}`
    const fullEnd = `${selectedDate}T${modalEndTime}`

    const validationMsg = validateBookingInput(fullStart, fullEnd, modalTitle)
    if (validationMsg) {
      setModalError(validationMsg)
      return
    }

    setBookingInProgress(true)
    setModalError('')
    try {
      await createBooking({
        roomId: bookingRoom.room_id,
        startsAt: localInputToIso(fullStart),
        endsAt: localInputToIso(fullEnd),
        title: modalTitle.trim(),
        description: modalDescription.trim(),
      })
      setBookingRoom(null)
      setModalTitle('')
      setModalDescription('')
      showNotice('success', 'Room booked. Availability has been refreshed.')
      await load()
    } catch (error) {
      setModalError(error.message || 'Could not create the booking.')
    } finally {
      setBookingInProgress(false)
    }
  }

  const liveIntervalError = () => {
    const fullStart = `${selectedDate}T${modalStartTime}`
    const fullEnd = `${selectedDate}T${modalEndTime}`
    return validateBookingInterval(fullStart, fullEnd)
  }

  return (
    <section>
      <h1 className="page-title">Available Rooms</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Select a date to check available rooms. Meeting duration: minimum 15 minutes, maximum 3 hours.
      </p>

      <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Refreshing…</p>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] card">
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                No rooms have opening hours covering {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((room) => (
                <article className="card p-5" key={room.room_id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-900 dark:text-white">{room.room_name}</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {room.floor_name} · Level {room.floor_level}
                      </p>
                    </div>
                    <span className={room.is_available ? 'status-free' : 'status-busy'}>
                      {room.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Capacity: {room.capacity}</p>
                    {room.is_available && (
                      <button
                        className="button-primary text-xs"
                        aria-label="Book room"
                        onClick={() => handleOpenBooking(room)}
                      >
                        Book Room
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="card flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Filters</span>
              <button
                className="button-secondary flex items-center gap-1.5 text-xs"
                onClick={load}
                disabled={loading}
              >
                <span className={`text-base leading-none ${loading ? 'animate-spin inline-block' : ''}`}>↻</span>
                <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
              </button>
            </div>

            <label className="block">
              <span className="label text-sm">Floor</span>
              <select
                className="field text-sm mt-1"
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
              >
                <option value="">All Active Floors</option>
                {floors.filter((f) => f.active).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · Level {f.level}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="label text-sm mb-1 block">Date</span>
              <MiniCalendar selectedDate={selectedDate} onChange={setSelectedDate} />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                Selected: <strong className="text-slate-800 dark:text-slate-200">{selectedDate}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {bookingRoom &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all"
            onClick={() => setBookingRoom(null)}
          >
            <div
              className="bg-white rounded-2xl p-7 sm:p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Book {bookingRoom.room_name}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {bookingRoom.floor_name} · Level {bookingRoom.floor_level} · Capacity: {bookingRoom.capacity}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-teal-800 dark:text-teal-400">
                    Date: {selectedDate}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setBookingRoom(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleConfirmBooking}>
                <label className="block">
                  <span className="label font-medium text-slate-700 dark:text-slate-300">Meeting Title</span>
                  <input
                    className="field mt-1"
                    placeholder="e.g. Q4 Strategy Review"
                    aria-label="Title"
                    value={modalTitle}
                    onChange={(e) => {
                      setModalTitle(e.target.value)
                      setModalError('')
                    }}
                    maxLength={120}
                    required
                  />
                </label>

                <label className="block">
                  <span className="label font-medium text-slate-700 dark:text-slate-300">Description (Optional)</span>
                  <textarea
                    className="field mt-1 min-h-24"
                    placeholder="Add an agenda, meeting notes, or dial-in link…"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    maxLength={1000}
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="label font-medium text-slate-700 dark:text-slate-300">Start Time</span>
                    <input
                      className="field mt-1"
                      type="time"
                      step="900"
                      value={modalStartTime}
                      onChange={(e) => handleModalStartTimeChange(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="label font-medium text-slate-700 dark:text-slate-300">End Time</span>
                    <input
                      className="field mt-1"
                      type="time"
                      step="900"
                      value={modalEndTime}
                      onChange={(e) => handleModalEndTimeChange(e.target.value)}
                      required
                    />
                  </label>
                </div>

                {(modalError || liveIntervalError()) && (
                  <div
                    className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-start gap-2.5 dark:bg-red-950/50 dark:border-red-900/60 dark:text-red-300"
                    role="alert"
                  >
                    <span className="text-base leading-none">⚠️</span>
                    <span>{modalError || liveIntervalError()}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setBookingRoom(null)}
                    disabled={bookingInProgress}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                    aria-label="Confirm booking"
                    disabled={bookingInProgress || Boolean(liveIntervalError())}
                  >
                    {bookingInProgress ? 'Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
