import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotice } from '../contexts/NoticeContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn } = useAuth()
  const { showNotice } = useNotice()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate(location.state?.from?.pathname || '/app', { replace: true })
    } catch (error) {
      showNotice('error', error.message || 'Unable to sign in.')
    } finally { setBusy(false) }
  }

  return <AuthCard title="Welcome back" subtitle="Sign in to see your meeting-room availability.">
    <form className="space-y-4" onSubmit={submit}>
      <Field label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <button className="button-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">New here? <Link className="font-semibold text-teal-700 hover:underline dark:text-teal-400" to="/register">Create an account</Link></p>
  </AuthCard>
}

export function AuthCard({ title, subtitle, children }) {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
    <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <p className="text-lg font-bold text-teal-800 dark:text-teal-400">MeetWise</p>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </section>
  </main>
}

export function Field({ label, value, onChange, ...props }) {
  const id = label.toLowerCase().replaceAll(' ', '-')
  return <label className="block" htmlFor={id}>
    <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <input id={id} className="field" value={value} onChange={(event) => onChange(event.target.value)} required {...props} />
  </label>
}
