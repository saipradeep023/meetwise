import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const NoticeContext = createContext(null)

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null)
  const timerRef = useRef(null)

  const clearNotice = useCallback(() => {
    setNotice(null)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const showNotice = useCallback((type, message, options = {}) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setNotice({ type, message })
    const isPersistent = Boolean(options?.persistent) || message === 'Choose a future start time.' || message === 'Choose a future start time'
    if (!isPersistent) {
      timerRef.current = setTimeout(() => setNotice(null), 20000)
    }
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <NoticeContext.Provider value={{ notice, showNotice, clearNotice }}>
      {children}
    </NoticeContext.Provider>
  )
}

export function useNotice() {
  const context = useContext(NoticeContext)
  if (!context) throw new Error('useNotice must be used inside NoticeProvider')
  return context
}
