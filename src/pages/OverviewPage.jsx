import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function OverviewPage() {
  const { profile } = useAuth()
  const admin = profile?.role === 'admin'
  return (
    <section>
      <h1 className="page-title">Hello, {profile?.full_name || 'There'}</h1>
      <p className="mt-2 text-slate-600">MeetWise keeps room availability private: you can see whether a room is free, never who is using it.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <Link className="card card-link" to="/app/availability">
          <h2>Check Availability</h2>
          <p>Browse active rooms and their current availability.</p>
        </Link>
        <Link className="card card-link" to="/app/bookings">
          <h2>My Bookings</h2>
          <p>Review or cancel your future room bookings.</p>
        </Link>
        {admin && (
          <Link className="card card-link" to="/app/admin/spaces">
            <h2>Configure Your Office</h2>
            <p>Add floors, rooms, weekly opening windows, or planned maintenance.</p>
          </Link>
        )}
        {admin && (
          <Link className="card card-link" to="/app/admin/analytics">
            <h2>View Utilization</h2>
            <p>Review booking, cancellation, and room utilization metrics.</p>
          </Link>
        )}
        {admin && (
          <Link className="card card-link" to="/app/admin/workspace-status">
            <h2>Review Workspace Status</h2>
            <p>Check account, room, schedule, and registration readiness.</p>
          </Link>
        )}
      </div>
    </section>
  )
}
