import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotice } from '../contexts/NoticeContext'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive
      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
  }`

function SignOutDialog({ onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])

  const handleCancel = () => {
    setVisible(false)
    setTimeout(onCancel, 200)
  }
  const handleConfirm = () => {
    setVisible(false)
    setTimeout(onConfirm, 200)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
      onClick={handleCancel}
    >
      <div
        className={`bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 transition-all duration-200 ease-out dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sign Out?</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Are you sure you want to sign out of MeetWise?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button className="button-secondary" onClick={handleCancel}>Cancel</button>
          <button
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            onClick={handleConfirm}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function AppShell() {
  const { profile, signOut } = useAuth()
  const { showNotice } = useNotice()
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('meetwise-theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  const applyTheme = (isDark) => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark')
        if (document.body) document.body.classList.add('dark')
        localStorage.setItem('meetwise-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        if (document.body) document.body.classList.remove('dark')
        localStorage.setItem('meetwise-theme', 'light')
      }
    } catch {
      void 0
    }
  }

  useEffect(() => {
    applyTheme(darkMode)
  }, [darkMode])

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev
      applyTheme(next)
      return next
    })
  }

  const admin = profile?.role === 'admin'
  const location = useLocation()
  const [pageKey, setPageKey] = useState(location.pathname)
  const [pageVisible, setPageVisible] = useState(true)

  useEffect(() => {
    setPageVisible(false)
    const t = setTimeout(() => {
      setPageKey(location.pathname)
      setPageVisible(true)
    }, 120)
    return () => clearTimeout(t)
  }, [location.pathname])

  const leave = async () => {
    try { await signOut() } catch (error) { showNotice('error', error.message) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex dark:bg-slate-950">
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 shadow-sm flex flex-col h-screen sticky top-0 z-30 dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 flex items-center justify-center dark:border-slate-800">
          <NavLink to="/app" className="text-xl font-bold tracking-tight text-teal-800 text-center dark:text-teal-400">
            MeetWise
          </NavLink>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          <NavLink end to="/app" className={linkClass}>Overview</NavLink>
          <NavLink to="/app/availability" className={linkClass}>Availability</NavLink>
          <NavLink to="/app/bookings" className={linkClass}>My Bookings</NavLink>
          {admin && <>
            <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Administration</p>
            <NavLink to="/app/admin/spaces" className={linkClass}>Floors &amp; Rooms</NavLink>
            <NavLink to="/app/admin/schedules" className={linkClass}>Hours &amp; Maintenance</NavLink>
            <NavLink to="/app/admin/access" className={linkClass}>Registration Access</NavLink>
            <NavLink to="/app/admin/bookings" className={linkClass}>All Bookings</NavLink>
            <NavLink to="/app/admin/analytics" className={linkClass}>Analytics</NavLink>
            <NavLink to="/app/admin/audit-log" className={linkClass}>Audit History</NavLink>
            <NavLink to="/app/admin/members" className={linkClass}>Team Members</NavLink>
            <NavLink to="/app/admin/workspace-status" className={linkClass}>Workspace Status</NavLink>
          </>}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-end gap-3 shrink-0 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={toggleTheme}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 p-1 transition-all duration-200 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-800"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                !darkMode
                  ? 'bg-amber-400 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                darkMode
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </span>
          </button>

          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile?.full_name || profile?.email}</span>
          <button className="button-signout" onClick={() => setShowSignOutDialog(true)}>Sign Out</button>
        </header>

        <main className="flex-1 px-6 py-6">
          <div
            key={pageKey}
            className="transition-opacity duration-200 ease-out"
            style={{ opacity: pageVisible ? 1 : 0 }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {showSignOutDialog && (
        <SignOutDialog
          onConfirm={leave}
          onCancel={() => setShowSignOutDialog(false)}
        />
      )}
    </div>
  )
}
