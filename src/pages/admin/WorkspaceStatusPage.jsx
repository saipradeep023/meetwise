import { useCallback, useEffect, useState } from 'react'
import { getWorkspaceStatus } from '../../lib/api'
import { useNotice } from '../../contexts/NoticeContext'

function StatusCard({ label, value, detail }) {
  return <article className="card"><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>{detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}</article>
}

export default function WorkspaceStatusPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showNotice } = useNotice()
  const load = useCallback(async () => {
    setLoading(true)
    try { setStatus(await getWorkspaceStatus()) }
    catch (error) { showNotice('error', error.message || 'Could not load workspace status.') }
    finally { setLoading(false) }
  }, [showNotice])
  useEffect(() => { load() }, [load])
  const accessConfigured = Boolean(status?.approved_email_domain) || Number(status?.allowlist_entries) > 0
  const roomsReady = Number(status?.active_rooms) > 0 && Number(status?.rooms_with_opening_hours) === Number(status?.active_rooms)
  return <section>
    <p className="eyebrow">Administration</p><h1 className="page-title">Workspace Status</h1>
    <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">Review the current configuration before inviting employees or deploying MeetWise.</p>
    <button className="button-secondary mt-5" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh status'}</button>
    {status && <><div className="mt-6 grid gap-4 sm:grid-cols-3"><StatusCard label="Active administrators" value={status.active_administrators} /><StatusCard label="Active employees" value={status.active_employees} /><StatusCard label="Active rooms" value={status.active_rooms} /></div><section className="card mt-6"><h2 className="section-title">Configuration checks</h2><ul className="mt-4 space-y-3 text-sm"><li className={accessConfigured ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>{accessConfigured ? '✓' : '•'} Employee registration rule: {accessConfigured ? 'configured' : 'add an approved domain or email allowlist entry'}</li><li className={roomsReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>{roomsReady ? '✓' : '•'} Opening hours: {roomsReady ? 'configured for every active room' : 'configure hours for each active room'}</li><li className={Number(status.active_administrators) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>{Number(status.active_administrators) > 0 ? '✓' : '•'} Administrator access: {Number(status.active_administrators) > 0 ? 'at least one active administrator' : 'no active administrator found'}</li></ul></section></>}
  </section>
}
