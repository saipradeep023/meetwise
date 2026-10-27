import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminRoomUtilization } from '../../lib/api'
import { companyDateValue, formatMinutes } from '../../lib/time'
import { useNotice } from '../../contexts/NoticeContext'

function defaultEndDate() {
  return companyDateValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
}

function Metric({ label, value, detail }) {
  return <article className="card"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>{detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}</article>
}

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(companyDateValue)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { showNotice } = useNotice()
  const load = useCallback(async () => {
    if (endDate <= startDate) { showNotice('error', 'Choose an end date after the start date.'); return }
    setLoading(true)
    try { setRows(await getAdminRoomUtilization(startDate, endDate)) }
    catch (error) { showNotice('error', error.message || 'Could not load analytics.') }
    finally { setLoading(false) }
  }, [startDate, endDate, showNotice])
  useEffect(() => { load() }, [load])
  const totals = useMemo(() => {
    const values = rows.reduce((all, row) => ({
      bookings: all.bookings + Number(row.booking_count || 0),
      cancellations: all.cancellations + Number(row.cancellation_count || 0),
      bookedMinutes: all.bookedMinutes + Number(row.booked_minutes || 0),
      scheduledMinutes: all.scheduledMinutes + Number(row.scheduled_minutes || 0),
    }), { bookings: 0, cancellations: 0, bookedMinutes: 0, scheduledMinutes: 0 })
    return { ...values, utilization: values.scheduledMinutes ? (values.bookedMinutes / values.scheduledMinutes) * 100 : 0 }
  }, [rows])
  return <section>
    <p className="eyebrow">Administration</p><h1 className="page-title">Room Utilization</h1>
    <p className="mt-2 text-slate-600 dark:text-slate-400">Scheduled minutes come from each room’s configured opening windows. The end date is excluded from the report.</p>
    <form className="card mt-6 flex flex-wrap items-end gap-4" onSubmit={(event) => { event.preventDefault(); load() }}><label><span className="label">Start date</span><input className="field" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label><label><span className="label">End date</span><input className="field" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label><button className="button-primary" disabled={loading}>{loading ? 'Refreshing…' : 'Refresh report'}</button></form>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Bookings" value={totals.bookings} /><Metric label="Cancellations" value={totals.cancellations} /><Metric label="Booked time" value={formatMinutes(totals.bookedMinutes)} /><Metric label="Overall utilization" value={`${totals.utilization.toFixed(1)}%`} detail={`${formatMinutes(totals.bookedMinutes)} of ${formatMinutes(totals.scheduledMinutes)}`} /></div>
    <section className="card mt-6 overflow-x-auto"><h2 className="section-title">By room</h2><table className="mt-4 w-full min-w-[42rem] text-left text-sm"><thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400"><tr><th className="pb-3 font-medium">Room</th><th className="pb-3 font-medium">Bookings</th><th className="pb-3 font-medium">Cancelled</th><th className="pb-3 font-medium">Booked time</th><th className="pb-3 font-medium">Utilization</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row) => { const percentage = Number(row.utilization_percent || 0); return <tr key={row.room_id}><td className="py-4"><p className="font-medium text-slate-900 dark:text-white">{row.room_name}</p><p className="text-slate-500 dark:text-slate-400">{row.floor_name} · Level {row.floor_level}</p></td><td className="py-4 text-slate-700 dark:text-slate-300">{row.booking_count}</td><td className="py-4 text-slate-700 dark:text-slate-300">{row.cancellation_count}</td><td className="py-4 text-slate-700 dark:text-slate-300">{formatMinutes(row.booked_minutes)}</td><td className="py-4"><div className="flex min-w-40 items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(percentage, 100)}%` }} /></div><span className="w-12 text-right text-slate-700 dark:text-slate-300">{percentage.toFixed(1)}%</span></div></td></tr> })}{!loading && !rows.length && <tr><td className="py-4 text-slate-500 dark:text-slate-400" colSpan="5">No rooms exist for this report.</td></tr>}</tbody></table></section>
  </section>
}
