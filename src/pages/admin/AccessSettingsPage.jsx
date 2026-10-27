import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { addAllowedEmail, getSignupSettings, removeAllowedEmail, saveApprovedDomain } from '../../lib/api'
import { useNotice } from '../../contexts/NoticeContext'

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
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
            Remove
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function AccessSettingsPage() {
  const [domain, setDomain] = useState('')
  const [allowlist, setAllowlist] = useState([])
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [pendingRemoveEmail, setPendingRemoveEmail] = useState(null)
  const { showNotice } = useNotice()

  const load = useCallback(async () => {
    try {
      const data = await getSignupSettings()
      setDomain(data.settings.approved_email_domain || '')
      setAllowlist(data.allowlist)
    } catch (error) { showNotice('error', error.message) }
  }, [showNotice])

  useEffect(() => { load() }, [load])

  const saveDomain = async (event) => {
    event.preventDefault()
    try {
      await saveApprovedDomain(domain.trim().toLowerCase())
      showNotice('success', 'Approved email domain saved.')
    } catch (error) { showNotice('error', error.message) }
  }

  const addEmail = async (event) => {
    event.preventDefault()
    try {
      await addAllowedEmail({ email: email.trim().toLowerCase(), note: note.trim() || null })
      setEmail(''); setNote(''); await load()
      showNotice('success', 'Email added to the allowlist.')
    } catch (error) { showNotice('error', error.message) }
  }

  const handleConfirmRemove = async () => {
    if (!pendingRemoveEmail) return
    const address = pendingRemoveEmail
    setPendingRemoveEmail(null)
    try {
      await removeAllowedEmail(address)
      await load()
      showNotice('success', 'Email removed from the allowlist.')
    } catch (error) { showNotice('error', error.message) }
  }

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Registration Access</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        New employees can register only with this domain or an exact email on the allowlist. The database hook enforces the same rule before the account exists.
      </p>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <form className="card space-y-6 p-7" onSubmit={saveDomain}>
          <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Approved Company Domain</h2>
          <label className="block">
            <span className="label font-medium text-slate-700 dark:text-slate-300">Domain (Without @)</span>
            <input
              className="field mt-1"
              type="text"
              placeholder="e.g. company.com"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Leave blank to require the allowlist for every new account.
            </p>
          </label>
          <div className="pt-2">
            <button className="button-primary w-full">Save Domain</button>
          </div>
        </form>

        <form className="card space-y-6 p-7" onSubmit={addEmail}>
          <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Add An Exception</h2>
          <label className="block">
            <span className="label font-medium text-slate-700 dark:text-slate-300">Email Address</span>
            <input
              className="field mt-1"
              type="email"
              placeholder="e.g. contractor@external.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="label font-medium text-slate-700 dark:text-slate-300">Internal Note</span>
            <input
              className="field mt-1"
              placeholder="e.g. Contractor, Q4 project"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="pt-2">
            <button className="button-primary w-full">Add Email</button>
          </div>
        </form>
      </div>

      <section className="card mt-8 p-7 space-y-4">
        <h2 className="section-title text-base font-bold text-slate-900 dark:text-white">Allowed Email Exceptions</h2>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {allowlist.map((entry) => (
            <li className="flex items-center justify-between gap-4 py-4" key={entry.email}>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{entry.email}</p>
                {entry.note && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{entry.note}</p>}
              </div>
              <button
                type="button"
                className="button-secondary hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                onClick={() => setPendingRemoveEmail(entry.email)}
              >
                Remove
              </button>
            </li>
          ))}
          {!allowlist.length && (
            <li className="py-4 text-sm text-slate-500 dark:text-slate-400">No email exceptions have been added.</li>
          )}
        </ul>
      </section>

      {pendingRemoveEmail && (
        <ConfirmDialog
          title="Remove Email Exception?"
          message={`Are you sure you want to remove ${pendingRemoveEmail} from the registration allowlist? They will no longer be able to register.`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemoveEmail(null)}
        />
      )}
    </section>
  )
}
