import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAuditLogs, getFloorsWithRooms } from '../../lib/api'
import { formatCompanyTime } from '../../lib/time'
import { useNotice } from '../../contexts/NoticeContext'
import MiniCalendar from '../../components/MiniCalendar'

const actionLabels = {
  booking_created: 'Booking Created',
  booking_cancelled_by_employee: 'Booking Cancelled By Employee',
  booking_cancelled_by_admin: 'Booking Cancelled By Admin',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const { showNotice } = useNotice()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logsData, floorsData] = await Promise.all([
        getAuditLogs(),
        getFloorsWithRooms(),
      ])
      setLogs(logsData)
      setFloors(floorsData)
    } catch (error) {
      showNotice('error', error.message || 'Could not load audit history.')
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

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return logs.filter((log) => {
      if (query) {
        const actorName = log.profiles?.full_name?.toLowerCase() || ''
        const actorEmail = log.profiles?.email?.toLowerCase() || ''
        const bookingTitle = log.bookings?.title?.toLowerCase() || ''
        if (!actorName.includes(query) && !actorEmail.includes(query) && !bookingTitle.includes(query)) {
          return false
        }
      }

      if (actionFilter === 'created' && log.action !== 'booking_created') return false
      if (actionFilter === 'cancelled' && !log.action.includes('cancelled')) return false

      if (selectedFloorId) {
        const floorId = log.bookings?.rooms?.floors?.id
        const floorName = log.bookings?.rooms?.floors?.name
        const targetFloor = floors.find((f) => f.id === selectedFloorId)
        if (floorId && floorId !== selectedFloorId) return false
        if (!floorId && targetFloor && floorName !== targetFloor.name) return false
      }

      if (selectedRoomId) {
        const roomId = log.bookings?.rooms?.id
        const roomName = log.bookings?.rooms?.name
        const targetRoom = availableRooms.find((r) => r.id === selectedRoomId)
        if (roomId && roomId !== selectedRoomId) return false
        if (!roomId && targetRoom && roomName !== targetRoom.name) return false
      }

      if (selectedDate) {
        const logDate = log.created_at.slice(0, 10)
        if (logDate !== selectedDate) return false
      }

      return true
    })
  }, [logs, searchQuery, actionFilter, selectedFloorId, selectedRoomId, selectedDate, floors, availableRooms])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedFloorId('')
    setSelectedRoomId('')
    setSelectedDate('')
    setActionFilter('all')
  }

  const hasActiveFilters = Boolean(
    searchQuery || selectedFloorId || selectedRoomId || selectedDate || actionFilter !== 'all'
  )

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Audit History</h1>
      <p className="mt-2 text-slate-600">
        Immutable record of room bookings and cancellations. The most recent 100 activities are tracked.
      </p>

      <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
              <strong className="text-slate-800">{logs.length}</strong> records
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          {!loading && !filteredLogs.length && (
            <div className="card p-8 text-center text-slate-500">
              No audit records match your selected filters.
            </div>
          )}

          {filteredLogs.map((log) => {
            const reason = log.metadata?.reason
            const booking = log.bookings
            const actor = log.profiles?.full_name || log.profiles?.email || 'System'
            const isCancelled = log.action.includes('cancelled')

            return (
              <article className="card p-5" key={log.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900 dark:text-white">
                        {actionLabels[log.action] || log.action}
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isCancelled
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {isCancelled ? 'Cancelled' : 'Created'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-200">Actor:</strong> {actor}
                    </p>
                    {booking && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-200">Booking:</strong> {booking.title}
                        {booking.rooms?.name ? ` · ${booking.rooms.name}` : ''}
                        {booking.rooms?.floors?.name ? ` (${booking.rooms.floors.name})` : ''}
                      </p>
                    )}
                    {reason && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md mt-1 dark:bg-slate-800/60 dark:text-slate-300">
                        <strong className="text-slate-700 dark:text-slate-200">Reason:</strong> {reason}
                      </p>
                    )}
                  </div>
                  <time className="text-xs font-medium text-slate-500 whitespace-nowrap dark:text-slate-400">
                    {formatCompanyTime(log.created_at)}
                  </time>
                </div>
              </article>
            )
          })}
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="card flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Filter History</h2>
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
              <span className="label text-sm">Search Actor / User</span>
              <input
                className="field text-sm mt-1"
                placeholder="Search actor, email, title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <div>
              <span className="label text-sm mb-1 block">Activity Type</span>
              <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
                {['all', 'created', 'cancelled'].map((act) => (
                  <button
                    key={act}
                    type="button"
                    className={`flex-1 rounded-md py-1.5 transition-colors ${
                      actionFilter === act
                        ? 'bg-white text-teal-800 font-semibold shadow-sm dark:bg-slate-700 dark:text-teal-300'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                    onClick={() => setActionFilter(act)}
                  >
                    {act.charAt(0).toUpperCase() + act.slice(1)}
                  </button>
                ))}
              </div>
            </div>

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
                    className="text-xs text-teal-700 hover:underline"
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
    </section>
  )
}
