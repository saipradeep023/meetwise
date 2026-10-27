import { useMemo } from 'react'
import { COMPANY_TIMEZONE } from '../lib/time'

function getCompanyToday() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}`
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function getMonthYear(dateStr) {
  const [y, m] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function MiniCalendar({ selectedDate, onChange }) {
  const today = getCompanyToday()
  const maxDate = addDays(today, 14)

  const todayDow = getDayOfWeek(today)
  const weekStart = addDays(today, -todayDow)

  const days = useMemo(() => {
    const arr = []
    for (let i = 0; i < 28; i++) arr.push(addDays(weekStart, i))
    return arr
  }, [weekStart])

  const headerLabel = useMemo(() => {
    const firstMonth = getMonthYear(days[0])
    const lastMonth = getMonthYear(days[27])
    if (firstMonth === lastMonth) return firstMonth
    const [fm] = firstMonth.split(' ')
    const [lm, ly] = lastMonth.split(' ')
    return `${fm} / ${lm} ${ly}`
  }, [days])

  return (
    <div className="w-full">
      <div className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">{headerLabel}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((l) => (
          <div key={l} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-1">{l}</div>
        ))}
        {days.map((dateStr) => {
          const isSelectable = dateStr >= today && dateStr <= maxDate
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today

          const [, , dd] = dateStr.split('-')
          const isFirstOfMonth = dd === '01'

          let cls = 'flex items-center justify-center rounded-full w-7 h-7 mx-auto text-xs cursor-default transition-colors duration-100 '
          if (isSelected) {
            cls += 'bg-teal-700 text-white font-bold'
          } else if (isSelectable) {
            cls += 'text-slate-800 dark:text-slate-100 hover:bg-teal-100 dark:hover:bg-teal-900/40 cursor-pointer' + (isToday ? ' font-semibold ring-1 ring-teal-400 dark:ring-teal-500' : '')
          } else {
            cls += 'text-slate-300 dark:text-slate-600'
          }

          return (
            <div key={dateStr} className="py-0.5 relative">
              {isFirstOfMonth && !isToday && (
                <span className="absolute -top-0.5 left-0 right-0 text-center text-[8px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                  {new Date(Date.UTC(...dateStr.split('-').map(Number).map((v, i) => i === 1 ? v - 1 : v))).toLocaleString('en-US', { month: 'short' })}
                </span>
              )}
              <div
                className={cls}
                onClick={() => isSelectable && onChange(dateStr)}
              >
                {parseInt(dateStr.slice(8), 10)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
