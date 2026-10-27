import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, active')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let alive = true
    const setAuthState = async (nextSession) => {
      try {
        const nextProfile = nextSession?.user ? await loadProfile(nextSession.user.id) : null
        if (alive) {
          setSession(nextSession)
          setProfile(nextProfile)
        }
      } catch {
        if (alive) {
          setSession(nextSession)
          setProfile(null)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => setAuthState(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => { setAuthState(nextSession) }, 0)
    })
    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut }),
    [session, profile, loading, signIn, signUp, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
