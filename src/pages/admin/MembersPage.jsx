import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { getMembers, setEmployeeActive } from '../../lib/api'
import { useNotice } from '../../contexts/NoticeContext'

function DeactivateDialog({ member, onConfirm, onCancel, saving }) {
  const [reason, setReason] = useState('')
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? 'bg-black/40' : 'bg-black/0'}`}
      onClick={onCancel}
    >
      <form
        className={`bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4 space-y-4 transition-all duration-200 ease-out dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Deactivate {member.full_name || member.email}?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Future confirmed bookings must be resolved before deactivating an account. A reason is required and will be recorded.
        </p>
        <label className="block">
          <span className="label font-medium text-slate-700 dark:text-slate-300">Reason For Deactivation</span>
          <textarea
            className="field mt-1 min-h-24"
            placeholder="Explain why this account is being deactivated…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-60"
            disabled={saving || !reason.trim()}
          >
            {saving ? 'Deactivating…' : 'Deactivate Account'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}

function ActivateDialog({ member, onConfirm, onCancel, saving }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? 'bg-black/40' : 'bg-black/0'}`}
      onClick={onCancel}
    >
      <div
        className={`bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4 transition-all duration-200 ease-out dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Activate {member.full_name || member.email}?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This employee will be reactivated and will be able to log in and make room bookings again.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="button-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? 'Activating…' : 'Activate Account'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deactivatingMember, setDeactivatingMember] = useState(null)
  const [activatingMember, setActivatingMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showNotice } = useNotice()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMembers(await getMembers())
    } catch (error) {
      showNotice('error', error.message || 'Could not load team members.')
    } finally {
      setLoading(false)
    }
  }, [showNotice])

  useEffect(() => { load() }, [load])

  const confirmDeactivation = async (reason) => {
    if (!deactivatingMember) return
    setSaving(true)
    try {
      await setEmployeeActive(deactivatingMember.id, false, reason)
      showNotice('success', `${deactivatingMember.full_name || deactivatingMember.email} has been deactivated.`)
      setDeactivatingMember(null)
      await load()
    } catch (error) {
      showNotice('error', error.message || 'Could not deactivate this account.')
    } finally {
      setSaving(false)
    }
  }

  const confirmActivation = async () => {
    if (!activatingMember) return
    setSaving(true)
    try {
      await setEmployeeActive(activatingMember.id, true, null)
      showNotice('success', `${activatingMember.full_name || activatingMember.email} has been activated.`)
      setActivatingMember(null)
      await load()
    } catch (error) {
      showNotice('error', error.message || 'Could not activate this account.')
    } finally {
      setSaving(false)
    }
  }

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) => {
      const name = member.full_name?.toLowerCase() || ''
      const email = member.email?.toLowerCase() || ''
      return name.includes(q) || email.includes(q)
    })
  }, [members, searchQuery])

  return (
    <section>
      <p className="eyebrow">Administration</p>
      <h1 className="page-title">Team Members</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Employee accounts can be activated or deactivated. Resolve an employee’s future bookings before deactivating their account.
      </p>

      <section className="card mt-8 p-7 space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <label className="block">
              <span className="sr-only">Search Team Members</span>
              <input
                className="field text-sm"
                placeholder="Search user by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 whitespace-nowrap">
            Showing <strong className="text-slate-800">{filteredMembers.length}</strong> of{' '}
            <strong className="text-slate-800">{members.length}</strong> members
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{member.full_name || 'Unnamed employee'}</p>
                    <p className="text-slate-500 dark:text-slate-400">{member.email}</p>
                  </td>
                  <td className="py-4 capitalize font-medium text-slate-700 dark:text-slate-300">{member.role}</td>
                  <td className="py-4">
                    <span className={member.active ? 'status-free' : 'status-busy'}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {member.role === 'employee' && (
                      <button
                        className={`button-secondary text-xs transition-colors duration-150 ${
                          member.active
                            ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                            : 'hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300'
                        }`}
                        onClick={() => {
                          if (member.active) {
                            setDeactivatingMember(member)
                          } else {
                            setActivatingMember(member)
                          }
                        }}
                      >
                        {member.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !filteredMembers.length && (
                <tr>
                  <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan="4">
                    No members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {deactivatingMember && (
        <DeactivateDialog
          member={deactivatingMember}
          saving={saving}
          onConfirm={confirmDeactivation}
          onCancel={() => setDeactivatingMember(null)}
        />
      )}

      {activatingMember && (
        <ActivateDialog
          member={activatingMember}
          saving={saving}
          onConfirm={confirmActivation}
          onCancel={() => setActivatingMember(null)}
        />
      )}
    </section>
  )
}
