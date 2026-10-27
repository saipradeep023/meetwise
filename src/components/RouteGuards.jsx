import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!profile?.active) return <InactiveAccount />
  return <Outlet />
}

export function AdminRoute() {
  const { profile } = useAuth()
  return profile?.role === 'admin' ? <Outlet /> : <Navigate to="/app" replace />
}

export function PublicOnlyRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  return user && profile?.active ? <Navigate to="/app" replace /> : <Outlet />
}

export function PageLoader() {
  return <div className="grid min-h-screen place-items-center text-slate-600">Loading MeetWise…</div>
}

function InactiveAccount() {
  const { signOut } = useAuth()
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Your account is not active</h1>
        <p className="mt-3 text-slate-600">Ask an administrator to activate your MeetWise account.</p>
        <button className="button-secondary mt-6" onClick={() => signOut()}>Sign out</button>
      </section>
    </main>
  )
}
