import { useEffect, useRef } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 15, 30, 45]

const ITEM_HEIGHT = 40

function ScrollColumn({ items, selected, onSelect, format }) {
  const listRef = useRef(null)
  const didMountRef = useRef(false)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const idx = items.indexOf(selected)
    if (idx === -1) return
    const top = idx * ITEM_HEIGHT
    if (!didMountRef.current) {
      el.scrollTop = top
      didMountRef.current = true
    } else {
      el.scrollTo({ top, behavior: 'smooth' })
    }
  }, [selected, items])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    if (items[clamped] !== selected) {
      onSelect(items[clamped])
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{ height: ITEM_HEIGHT * 3, scrollSnapType: 'y mandatory' }}
        className="overflow-y-auto scroll-smooth w-14 rounded-md border border-slate-200 bg-white"
      >
        <div style={{ height: ITEM_HEIGHT }} />
        {items.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: 'start' }}
            className={`flex items-center justify-center cursor-pointer text-sm font-medium select-none transition-colors
              ${item === selected ? 'bg-teal-700 text-white rounded-md' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {format(item)}
          </div>
        ))}
        <div style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  )
}

export default function TimePicker({ value, onChange }) {
  const [hStr, mStr] = (value || '00:00').split(':')
  const hour = parseInt(hStr, 10) || 0
  const minute = parseInt(mStr, 10) || 0

  const setHour = (h) => {
    const mm = String(minute).padStart(2, '0')
    onChange(`${String(h).padStart(2, '0')}:${mm}`)
  }
  const setMinute = (m) => {
    const hh = String(hour).padStart(2, '0')
    onChange(`${hh}:${String(m).padStart(2, '0')}`)
  }

  const displayHour = String(hour).padStart(2, '0')
  const displayMinute = String(minute).padStart(2, '0')

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-sm font-semibold text-teal-700 tabular-nums">
        {displayHour}:{displayMinute}
      </div>
      <div className="flex gap-2 items-center">
        <ScrollColumn
          items={HOURS}
          selected={hour}
          onSelect={setHour}
          format={(h) => String(h).padStart(2, '0')}
        />
        <span className="text-slate-400 font-bold text-lg">:</span>
        <ScrollColumn
          items={MINUTES}
          selected={minute}
          onSelect={setMinute}
          format={(m) => String(m).padStart(2, '0')}
        />
      </div>
    </div>
  )
}
