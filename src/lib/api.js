import { supabase } from './supabase'

function unwrap(result) {
  if (result.error) throw result.error
  return result.data
}

export async function getFloorsWithRooms() {
  return unwrap(await supabase
    .from('floors')
    .select('id, name, level, active, rooms(id, name, capacity, amenities, active)')
    .order('level')
    .order('name'))
}

export async function createFloor(values) {
  return unwrap(await supabase.from('floors').insert(values).select().single())
}

export async function updateFloor(id, values) {
  return unwrap(await supabase.from('floors').update(values).eq('id', id).select().single())
}

export async function createRoom(values) {
  return unwrap(await supabase.from('rooms').insert(values).select().single())
}

export async function updateRoom(id, values) {
  return unwrap(await supabase.from('rooms').update(values).eq('id', id).select().single())
}

export async function getAdminRooms() {
  return unwrap(await supabase
    .from('rooms')
    .select('id, name, capacity, active, floor_id, floors!inner(name, level)')
    .order('name'))
}

export async function getOpeningWindows(roomId) {
  let query = supabase.from('room_opening_windows').select('*').order('weekday').order('opens_at')
  if (roomId) query = query.eq('room_id', roomId)
  return unwrap(await query)
}

export async function addOpeningWindow(values) {
  return unwrap(await supabase.from('room_opening_windows').insert(values).select().single())
}

export async function addOpeningWindows(records) {
  return unwrap(await supabase.from('room_opening_windows').insert(records))
}

export async function updateOpeningWindow(id, values) {
  return unwrap(await supabase.from('room_opening_windows').update(values).eq('id', id).select().single())
}

export async function removeOpeningWindow(id) {
  return unwrap(await supabase.from('room_opening_windows').delete().eq('id', id))
}

export async function getUnavailability(roomId) {
  let query = supabase.from('room_unavailability').select('*').order('starts_at')
  if (roomId) query = query.eq('room_id', roomId)
  return unwrap(await query)
}

export async function addUnavailability(values) {
  return unwrap(await supabase.from('room_unavailability').insert(values).select().single())
}

export async function removeUnavailability(id) {
  return unwrap(await supabase.from('room_unavailability').delete().eq('id', id))
}

export async function getAvailability(startAt, endAt, floorId = null) {
  return unwrap(await supabase.rpc('available_rooms_for_slot', {
    p_start_at: startAt,
    p_end_at: endAt,
    p_floor_id: floorId || null,
  }))
}

export async function getAvailabilityForDate(date, floorId = null) {
  try {
    const result = await supabase.rpc('available_rooms_for_date', {
      p_date: date,
      p_floor_id: floorId || null,
    })
    if (!result.error && Array.isArray(result.data)) return result.data
  } catch {
    void 0
  }
  return getAvailability(`${date}T12:00:00+05:30`, `${date}T13:00:00+05:30`, floorId)
}

export async function getSignupSettings() {
  const [settings, allowlist] = await Promise.all([
    supabase.from('company_settings').select('approved_email_domain, timezone').eq('id', true).single(),
    supabase.from('signup_email_allowlist').select('email, note, created_at').order('email'),
  ])
  return { settings: unwrap(settings), allowlist: unwrap(allowlist) }
}

export async function saveApprovedDomain(domain) {
  return unwrap(await supabase.from('company_settings').update({ approved_email_domain: domain || null }).eq('id', true).select().single())
}

export async function addAllowedEmail(values) {
  return unwrap(await supabase.from('signup_email_allowlist').insert(values).select().single())
}

export async function removeAllowedEmail(email) {
  return unwrap(await supabase.from('signup_email_allowlist').delete().eq('email', email))
}

export async function createBooking({ roomId, startsAt, endsAt, title, description }) {
  return unwrap(await supabase.rpc('book_room', {
    p_room_id: roomId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_title: title,
    p_description: description || null,
  }))
}

export async function getMyBookings() {
  return unwrap(await supabase
    .from('bookings')
    .select('id, title, description, starts_at, ends_at, status, cancelled_at, cancellation_reason, rooms(name, floors(name, level))')
    .order('starts_at', { ascending: true }))
}

export async function cancelMyBooking(bookingId) {
  return unwrap(await supabase.rpc('cancel_own_booking', { p_booking_id: bookingId }))
}

export async function getAdminBookings() {
  return unwrap(await supabase
    .from('bookings')
    .select('id, title, description, starts_at, ends_at, status, cancellation_reason, user_id, profiles!bookings_user_id_fkey(full_name, email), rooms(id, name, floors(id, name, level))')
    .order('starts_at', { ascending: true }))
}

export async function cancelBookingAsAdmin(bookingId, reason) {
  return unwrap(await supabase.rpc('cancel_booking_as_admin', { p_booking_id: bookingId, p_reason: reason }))
}

export async function getAdminRoomUtilization(startDate, endDate) {
  return unwrap(await supabase.rpc('admin_room_utilization', {
    p_start_date: startDate,
    p_end_date: endDate,
  }))
}

export async function getAuditLogs() {
  return unwrap(await supabase
    .from('audit_logs')
    .select('id, action, metadata, created_at, profiles(full_name, email), bookings(title, starts_at, rooms(id, name, floors(id, name, level)))')
    .order('created_at', { ascending: false })
    .limit(100))
}

export async function getMembers() {
  return unwrap(await supabase
    .from('profiles')
    .select('id, full_name, email, role, active, created_at')
    .order('created_at', { ascending: false }))
}

export async function setEmployeeActive(profileId, active, reason = null) {
  return unwrap(await supabase.rpc('set_employee_active', {
    p_profile_id: profileId,
    p_active: active,
    p_reason: reason,
  }))
}

export async function getWorkspaceStatus() {
  const result = await supabase.rpc('admin_workspace_status')
  const data = unwrap(result)
  return Array.isArray(data) ? data[0] : data
}
