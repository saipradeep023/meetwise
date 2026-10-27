import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthCard, Field } from './LoginPage'
import { useAuth } from '../contexts/AuthContext'
import { useNotice } from '../contexts/NoticeContext'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { signUp } = useAuth()
  const { showNotice } = useNotice()
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await signUp({ fullName: fullName.trim(), email: email.trim(), password })
      showNotice('success', result.session ? 'Account created. You can now sign in.' : 'Check your email to confirm your account, then sign in.')
    } catch (error) {
      showNotice('error', error.message || 'Unable to create the account.')
    } finally { setBusy(false) }
  }
  return <AuthCard title="Create your account" subtitle="Use your approved company email address.">
    <form className="space-y-4" onSubmit={submit}>
      <Field label="Full name" type="text" value={fullName} onChange={setFullName} autoComplete="name" />
      <Field label="Work email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} minLength="8" autoComplete="new-password" />
      <button className="button-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="mt-6 text-sm text-slate-600">Already registered? <Link className="font-semibold text-teal-700 hover:underline" to="/login">Sign in</Link></p>
  </AuthCard>
}
