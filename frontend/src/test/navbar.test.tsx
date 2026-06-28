import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'

function NavbarPure({
  username,
  role,
  onLogout,
}: {
  username: string
  role: 'admin' | 'user'
  onLogout: () => void
}) {
  return (
    <nav>
      <span>Book Booker</span>
      <span>{username}</span>
      {role === 'admin' && <a href="/users">Users</a>}
      {role === 'user' && <a href="/reservations">My Reservations</a>}
      <button onClick={onLogout}>Logout</button>
    </nav>
  )
}

describe('Navbar', () => {
  it('shows admin links for admin role', () => {
    render(<NavbarPure username="admin" role="admin" onLogout={() => {}} />)
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.queryByText('My Reservations')).not.toBeInTheDocument()
  })

  it('shows user links for user role', () => {
    render(<NavbarPure username="user" role="user" onLogout={() => {}} />)
    expect(screen.getByText('My Reservations')).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
  })

  it('calls onLogout when logout button clicked', async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn()
    render(<NavbarPure username="admin" role="admin" onLogout={onLogout} />)
    await user.click(screen.getByText('Logout'))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
