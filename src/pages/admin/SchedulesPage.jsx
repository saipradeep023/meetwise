import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addOpeningWindow,
  addOpeningWindows,
  addUnavailability,
  getAdminRooms,
  getOpeningWindows,
  getUnavailability,
  removeUnavailability,
  updateOpeningWindow,
} from '../../lib/api'
import { formatCompanyTime, localInputToIso, nextQuarterHourRange } from '../../lib/time'
import { useNotice } from '../../contexts/NoticeContext'

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function ConfirmDialog({ title, message, confirmLabel = 'Remove', onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])

  const handleCancel = () => { setVisible(false); setTimeout(onCancel, 200) }
  const handleConfirm = () => { setVisible(false); setTimeout(onConfirm, 200) }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? 'bg-black/40' : 'bg-black/0'}`}
      onClick={handleCancel}
    >
      <div
        className={`bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 transition-all duration-200 ease-out dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="button-secondary" onClick={handleCancel}>Cancel</button>
          <button
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function SchedulesPage() {
  const [rooms, setRooms] = useState([])
  const [roomId, setRoomId] = useState('')
  const [windows, setWindows] = useState([])
  const [unavailability, setUnavailability] = useState([])
  const [windowForm, setWindowForm] = useState({ weekday: '1', opens_at: '09:00', closes_at: '18:00' })
  const [maintenanceForm, setMaintenanceForm] = useState(() => {
    const range = nextQuarterHourRange(120)
    return { starts_at: range.start, ends_at: range.end, reason: '' }
  })
  const [maintenanceFilter, setMaintenanceFilter] = useState('all')
  const [pendingDeleteMaintenance, setPendingDeleteMaintenance] = useState(null)
  const { showNotice } = useNotice()

  const refreshRoomData = useCallback(async (id) => {
    if (!id) { setWindows([]); setUnavailability([]); return }
    try {
      let [nextWindows, nextUnavailability] = await Promise.all([getOpeningWindows(id), getUnavailability(id)])
      if (nextWindows.length === 0) {
        const defaultWindows = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          room_id: id,
          weekday: day,
          opens_at: '09:00',
          closes_at: '18:00',
        }))
        try {
          await addOpeningWindows(defaultWindows)
          nextWindows = await getOpeningWindows(id)
        } catch {
          void 0
        }
      }
      setWindows(nextWindows)
      setUnavailability(nextUnavailability)
    } catch (error) { showNotice('error', error.message) }
  }, [showNotice])

  const loadRooms = useCallback(async () => {
    try {
      const data = await getAdminRooms()
      setRooms(data)
      if (data[0]) setRoomId((current) => current || data[0].id)
    } catch (error) { showNotice('error', error.message) }
  }, [showNotice])

  useEffect(() => { loadRooms() }, [loadRooms])
  useEffect(() => { refreshRoomData(roomId) }, [roomId, refreshRoomData])

  const handleWeekdayChange = (newWeekday) => {
    const existing = windows.find((w) => w.weekday === Number(newWeekday))
    setWindowForm({
      weekday: newWeekday,
      opens_at: existing ? existing.opens_at.slice(0, 5) : '09:00',
      closes_at: existing ? existing.closes_at.slice(0, 5) : '18:00',
    })
  }

  useEffect(() => {
    const existing = windows.find((w) => w.weekday === Number(windowForm.weekday))
    if (existing) {
      setWindowForm((curr) => ({
        ...curr,
        opens_at: existing.opens_at.slice(0, 5),
        closes_at: existing.closes_at.slice(0, 5),
      }))
    }
  }, [windows, windowForm.weekday])

  const saveOpeningWindow = async (event) => {
    event.preventDefault()
    if (windowForm.opens_at >= windowForm.closes_at) {
      showNotice('error', 'Opening time must be before closing time.')
      return
    }

    const weekdayNum = Number(windowForm.weekday)
    const existing = windows.find((w) => w.weekday === weekdayNum)

    try {
      if (existing) {
        await updateOpeningWindow(existing.id, {
          opens_at: windowForm.opens_at,
          closes_at: windowForm.closes_at,
        })
        showNotice('success', `Opening window for ${days[weekdayNum]} updated.`)
      } else {
        await addOpeningWindow({
          room_id: roomId,
          weekday: weekdayNum,
          opens_at: windowForm.opens_at,
          closes_at: windowForm.closes_at,
        })
        showNotice('success', `Opening window for ${days[weekdayNum]} saved.`)
      }
      await refreshRoomData(roomId)
    } catch (error) {
      showNotice('error', error.message)
    }
  }

  const addMaintenance = async (event) => {
    event.preventDefault()
    if (new Date(maintenanceForm.starts_at) >= new Date(maintenanceForm.ends_at)) {
      showNotice('error', 'Start time must be before end time.')
      return
    }

    try {
      await addUnavailability({
        room_id: roomId,
        starts_at: localInputToIso(maintenanceForm.starts_at),
        ends_at: localInputToIso(maintenanceForm.ends_at),
        reason: maintenanceForm.reason.trim() || null,
      })
      await refreshRoomData(roomId)
      showNotice('success', 'Maintenance period scheduled.')
      const nextRange = nextQuarterHourRange(120)
      setMaintenanceForm({ starts_at: nextRange.start, ends_at: nextRange.end, reason: '' })
    } catch (error) {
      showNotice('error', error.message)
    }
  }

  const confirmDeleteMaintenance = async () => {
    if (!pendingDeleteMaintenance) return
    const { id } = pendingDeleteMaintenance
    setPendingDeleteMaintenance(null)
    try {
      await removeUnavailability(id)
      showNotice('success', 'Maintenance period removed.')
      await refreshRoomData(roomId)
    } catch (error) {
      showNotice('error', error.message)
    }
  }

  const selected = rooms.find((room) => room.id === roomId)
  const now = new Date()

  const filteredUnavailability = unavailability.filter((entry) => {
    const isCompleted = new Date(entry.ends_at) <= now
    if (maintenanceFilter === 'completed') return isCompleted
    if (maintenanceFilter === 'scheduled') return !isCompleted
    return true
  })

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Hours And Maintenance</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Configure daily operating windows and maintenance schedules for each room.
      </p>

      <div className="mt-6 max-w-xl">
        <label className="block">
          <span className="label font-semibold">Select Room</span>
          <select
            className="field mt-1"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.floors.name} · Level {room.floors.level} · {room.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selected && <p className="mt-6 text-slate-600 dark:text-slate-400">Add an active room before configuring its schedule.</p>}

      {selected && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-8 xl:grid-cols-2">
            <form className="card space-y-6 p-7" onSubmit={saveOpeningWindow}>
              <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Edit The Opening Window</h2>
              <label className="block">
                <span className="label">Day Of Week</span>
                <select
                  className="field mt-1"
                  value={windowForm.weekday}
                  onChange={(e) => handleWeekdayChange(e.target.value)}
                >
                  {days.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Opens At</span>
                  <input
                    className="field mt-1"
                    type="time"
                    step="900"
                    value={windowForm.opens_at}
                    onChange={(e) => setWindowForm({ ...windowForm, opens_at: e.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className="label">Closes At</span>
                  <input
                    className="field mt-1"
                    type="time"
                    step="900"
                    value={windowForm.closes_at}
                    onChange={(e) => setWindowForm({ ...windowForm, closes_at: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pt-1">
                <button className="button-primary w-full">Save Opening Window</button>
              </div>
            </form>

            <form className="card space-y-6 p-7" onSubmit={addMaintenance}>
              <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Schedule Maintenance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Starts At</span>
                  <input
                    className="field mt-1"
                    type="datetime-local"
                    step="900"
                    value={maintenanceForm.starts_at}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, starts_at: e.target.value })}
                    required
                  />
                </label>
                <label className="block">
                  <span className="label">Ends At</span>
                  <input
                    className="field mt-1"
                    type="datetime-local"
                    step="900"
                    value={maintenanceForm.ends_at}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, ends_at: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="label">Reason (Optional)</span>
                <input
                  className="field mt-1"
                  placeholder="e.g. Projector replacement, deep cleaning"
                  value={maintenanceForm.reason}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                />
              </label>

              <div className="pt-1">
                <button className="button-primary w-full">Schedule Maintenance</button>
              </div>
            </form>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <section className="card p-7 space-y-4">
              <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Weekly Opening Windows</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rooms operate everyday with standard hours (09:00–18:00). You can edit the hours for any day of the week.
              </p>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {days.map((dayName, dayIndex) => {
                  const window = windows.find((w) => w.weekday === dayIndex)
                  const opensAt = window ? window.opens_at.slice(0, 5) : '09:00'
                  const closesAt = window ? window.closes_at.slice(0, 5) : '18:00'

                  return (
                    <li className="flex items-center justify-between gap-3 py-3" key={dayIndex}>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{dayName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {opensAt} – {closesAt}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button-secondary text-xs"
                        onClick={() => {
                          setWindowForm({
                            weekday: String(dayIndex),
                            opens_at: opensAt,
                            closes_at: closesAt,
                          })
                        }}
                      >
                        Edit
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="card p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Maintenance Records</h2>
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
                  {['all', 'scheduled', 'completed'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`rounded-md px-2.5 py-1 transition-colors ${
                        maintenanceFilter === f
                          ? 'bg-white text-teal-800 font-semibold shadow-sm dark:bg-slate-700 dark:text-teal-300'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      onClick={() => setMaintenanceFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUnavailability.map((entry) => {
                  const entryEnd = new Date(entry.ends_at)
                  const entryStart = new Date(entry.starts_at)
                  const isCompleted = entryEnd <= now
                  const isOngoing = entryStart <= now && entryEnd > now

                  return (
                    <li className="flex items-start justify-between gap-3 py-3" key={entry.id}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isCompleted
                                ? 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                               : isOngoing
                                ? 'status-ongoing'
                                : 'status-free'
                            }
                          >
                            {isCompleted ? 'Completed' : isOngoing ? 'In Progress' : 'Scheduled'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {formatCompanyTime(entry.starts_at)} – {formatCompanyTime(entry.ends_at)}
                        </p>
                        {entry.reason && <p className="text-xs text-slate-500 dark:text-slate-400">Reason: {entry.reason}</p>}
                      </div>
                      <button
                        type="button"
                        className="button-secondary text-xs shrink-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        onClick={() =>
                          setPendingDeleteMaintenance({
                            id: entry.id,
                            title: 'Remove Maintenance Period?',
                            message: 'Are you sure you want to remove this maintenance period? The room will become available during this time slot.',
                          })
                        }
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
                {!filteredUnavailability.length && (
                  <li className="py-4 text-sm text-slate-500 dark:text-slate-400">
                    No {maintenanceFilter !== 'all' ? maintenanceFilter : ''} maintenance records found.
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      )}

      {pendingDeleteMaintenance && (
        <ConfirmDialog
          title={pendingDeleteMaintenance.title}
          message={pendingDeleteMaintenance.message}
          confirmLabel="Remove"
          onConfirm={confirmDeleteMaintenance}
          onCancel={() => setPendingDeleteMaintenance(null)}
        />
      )}
    </section>
  )
}
