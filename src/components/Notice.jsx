import { useEffect, useState } from 'react'
import { useNotice } from '../contexts/NoticeContext'

export default function Notice() {
  const { notice, clearNotice } = useNotice()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [notice])

  if (!notice) return null

  const tone =
    notice.type === 'error'
      ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
      : 'border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200'

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ease-out ${tone} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
      role="alert"
    >
      <p className="text-sm font-medium">{notice.message}</p>
      <button className="text-lg leading-none" onClick={clearNotice} aria-label="Dismiss message">×</button>
    </div>
  )
}
