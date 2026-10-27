import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppShell from './AppShell'

const auth = vi.hoisted(() => ({
  profile: { full_name: 'Jane Doe', email: 'jane@example.com', role: 'admin' },
  signOut: vi.fn(),
}))
const notices = vi.hoisted(() => ({ showNotice: vi.fn(), clearNotice: vi.fn(), notice: null }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => auth,
}))
vi.mock('../contexts/NoticeContext', () => ({
  useNotice: () => notices,
}))

describe('AppShell Theme Toggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.body.className = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    document.body.className = ''
  })

  it('toggles theme between dark and light mode on click', () => {
    localStorage.setItem('meetwise-theme', 'dark')

    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i })
    expect(toggleBtn).toBeInTheDocument()

    fireEvent.click(toggleBtn)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('meetwise-theme')).toBe('light')

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('meetwise-theme')).toBe('dark')
  })
})
