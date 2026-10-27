import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { createFloor, createRoom, getFloorsWithRooms, updateFloor, updateRoom, addOpeningWindows } from '../../lib/api'
import { useNotice } from '../../contexts/NoticeContext'

const initialFloor = { name: '', level: '' }
const initialRoom = { floor_id: '', name: '', capacity: '1', amenities: '' }

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
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
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-700 hover:bg-teal-800'}`}
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

export default function SpacesPage() {
  const [floors, setFloors] = useState([])
  const [floorForm, setFloorForm] = useState(initialFloor)
  const [roomForm, setRoomForm] = useState(initialRoom)
  const [busy, setBusy] = useState(false)
  const { showNotice } = useNotice()

  const [pendingToggle, setPendingToggle] = useState(null)

  const load = useCallback(async () => {
    try { setFloors(await getFloorsWithRooms()) }
    catch (error) { showNotice('error', error.message) }
  }, [showNotice])

  useEffect(() => { load() }, [load])

  const sortedFloors = [...floors].sort((a, b) => a.level - b.level).map((floor) => ({
    ...floor,
    rooms: [...(floor.rooms ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
  }))

  const addFloor = async (event) => {
    event.preventDefault(); setBusy(true)
    try {
      await createFloor({ name: floorForm.name.trim(), level: Number(floorForm.level) })
      setFloorForm(initialFloor); await load(); showNotice('success', 'Floor added.')
    } catch (error) { showNotice('error', error.message) } finally { setBusy(false) }
  }

  const addRoom = async (event) => {
    event.preventDefault(); setBusy(true)
    try {
      const room = await createRoom({
        floor_id: roomForm.floor_id,
        name: roomForm.name.trim(),
        capacity: Number(roomForm.capacity),
        amenities: roomForm.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      })
      if (room && room.id) {
        const defaultWindows = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          room_id: room.id,
          weekday: day,
          opens_at: '09:00',
          closes_at: '18:00',
        }))
        await addOpeningWindows(defaultWindows)
      }
      setRoomForm(initialRoom); await load(); showNotice('success', 'Room added with default hours (09:00–18:00 everyday).')
    } catch (error) { showNotice('error', error.message) } finally { setBusy(false) }
  }

  const requestToggleFloor = (floor) => {
    if (floor.active) {
      setPendingToggle({ type: 'floor', item: floor, enabling: false })
    } else {
      doToggleFloor(floor, true)
    }
  }

  const requestToggleRoom = (room) => {
    if (room.active) {
      setPendingToggle({ type: 'room', item: room, enabling: false })
    } else {
      doToggleRoom(room, true)
    }
  }

  const doToggleFloor = async (floor, enabling) => {
    try {
      await updateFloor(floor.id, { active: enabling })
      await load()
      showNotice('success', `Floor ${enabling ? 'activated' : 'deactivated'}.`)
    } catch (error) { showNotice('error', error.message) }
  }

  const doToggleRoom = async (room, enabling) => {
    try {
      await updateRoom(room.id, { active: enabling })
      await load()
      showNotice('success', `Room ${enabling ? 'activated' : 'deactivated'}.`)
    } catch (error) { showNotice('error', error.message) }
  }

  const confirmToggle = () => {
    if (!pendingToggle) return
    const { type, item, enabling } = pendingToggle
    setPendingToggle(null)
    if (type === 'floor') doToggleFloor(item, enabling)
    else doToggleRoom(item, enabling)
  }

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Floors And Rooms</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">One building, organized by floor. Resolve future confirmed bookings before deactivating a space.</p>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <form className="card space-y-6 p-7" onSubmit={addFloor}>
          <h2 className="section-title text-base">Add A Floor</h2>
          <label className="block">
            <span className="label">Floor Name</span>
            <input
              className="field mt-1"
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              placeholder="e.g. Ground Floor"
              required
            />
          </label>
          <label className="block">
            <span className="label">Level Number</span>
            <input
              className="field mt-1"
              type="number"
              value={floorForm.level}
              onChange={(e) => setFloorForm({ ...floorForm, level: e.target.value })}
              placeholder="e.g. 1"
              required
            />
          </label>
          <div className="pt-1">
            <button className="button-primary w-full" disabled={busy}>Add Floor</button>
          </div>
        </form>

        <form className="card space-y-6 p-7" onSubmit={addRoom}>
          <h2 className="section-title text-base">Add A Room</h2>
          <label className="block">
            <span className="label">Floor</span>
            <select
              className="field mt-1"
              value={roomForm.floor_id}
              onChange={(e) => setRoomForm({ ...roomForm, floor_id: e.target.value })}
              required
            >
              <option value="">Select a floor</option>
              {sortedFloors.filter((f) => f.active).map((f) => (
                <option value={f.id} key={f.id}>{f.name} · Level {f.level}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Room Name</span>
            <input
              className="field mt-1"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              placeholder="e.g. Boardroom A"
              required
            />
          </label>
          <label className="block">
            <span className="label">Capacity</span>
            <input
              className="field mt-1"
              type="number"
              min="1"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
              required
            >
            </input>
          </label>
          <label className="block">
            <span className="label">Amenities (comma-separated)</span>
            <input
              className="field mt-1"
              value={roomForm.amenities}
              onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
              placeholder="e.g. Projector, Whiteboard"
            />
          </label>
          <div className="pt-1">
            <button className="button-primary w-full" disabled={busy}>Add Room</button>
          </div>
        </form>
      </div>

      <div className="mt-10 space-y-5">
        {sortedFloors.map((floor) => (
          <article className="card" key={floor.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {floor.name}
                  <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">· Level {floor.level}</span>
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{floor.active ? 'Active' : 'Inactive'}</p>
              </div>
              <button
                className={`button-secondary transition-colors duration-150 ${floor.active ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-300' : ''}`}
                onClick={() => requestToggleFloor(floor)}
              >
                {floor.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {floor.rooms?.map((room) => (
                <li className="flex items-center justify-between gap-3 py-3" key={room.id}>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{room.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Capacity {room.capacity}
                      {room.amenities?.length ? ` · ${room.amenities.join(', ')}` : ''}
                      {!room.active && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">(Inactive)</span>}
                    </p>
                  </div>
                  <button
                    className={`button-secondary transition-colors duration-150 ${room.active ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-300' : ''}`}
                    onClick={() => requestToggleRoom(room)}
                  >
                    {room.active ? 'Deactivate' : 'Activate'}
                  </button>
                </li>
              ))}
              {!floor.rooms?.length && (
                <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No rooms yet.</li>
              )}
            </ul>
          </article>
        ))}
      </div>

      {pendingToggle && (
        <ConfirmDialog
          title={`Deactivate ${pendingToggle.item.name}?`}
          message={
            pendingToggle.type === 'floor'
              ? `All future confirmed bookings for rooms on ${pendingToggle.item.name} must be resolved first. Continue?`
              : `All future confirmed bookings for ${pendingToggle.item.name} must be resolved first. Continue?`
          }
          confirmLabel="Deactivate"
          danger
          onConfirm={confirmToggle}
          onCancel={() => setPendingToggle(null)}
        />
      )}
    </section>
  )
}
