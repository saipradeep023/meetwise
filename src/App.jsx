import { Navigate, Route, Routes } from 'react-router-dom'
import Notice from './components/Notice'
import AppShell from './components/AppShell'
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import OverviewPage from './pages/OverviewPage'
import AvailabilityPage from './pages/AvailabilityPage'
import MyBookingsPage from './pages/MyBookingsPage'
import SpacesPage from './pages/admin/SpacesPage'
import SchedulesPage from './pages/admin/SchedulesPage'
import AccessSettingsPage from './pages/admin/AccessSettingsPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import MembersPage from './pages/admin/MembersPage'
import WorkspaceStatusPage from './pages/admin/WorkspaceStatusPage'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  if (!isSupabaseConfigured) return <SetupPage />
  return (
    <>
      <Notice />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="admin/spaces" element={<SpacesPage />} />
              <Route path="admin/schedules" element={<SchedulesPage />} />
              <Route path="admin/access" element={<AccessSettingsPage />} />
              <Route path="admin/bookings" element={<AdminBookingsPage />} />
              <Route path="admin/analytics" element={<AnalyticsPage />} />
              <Route path="admin/audit-log" element={<AuditLogPage />} />
              <Route path="admin/members" element={<MembersPage />} />
              <Route path="admin/workspace-status" element={<WorkspaceStatusPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
