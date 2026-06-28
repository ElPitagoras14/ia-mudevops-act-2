import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Test dashboard content based on role

function DashboardPure({ role }: { role: 'admin' | 'user' }) {
  return (
    <div>
      <h1>Dashboard</h1>
      {role === 'admin' && (
        <>
          <a href="/users">Manage users</a>
          <a href="/books/new">Create book</a>
        </>
      )}
      {role === 'user' && (
        <>
          <a href="/books">Browse books</a>
          <a href="/reservations">View reservations</a>
        </>
      )}
    </div>
  )
}

describe('Dashboard', () => {
  it('admin sees admin links', () => {
    render(<DashboardPure role="admin" />)
    expect(screen.getByText('Manage users')).toBeInTheDocument()
    expect(screen.getByText('Create book')).toBeInTheDocument()
    expect(screen.queryByText('Browse books')).not.toBeInTheDocument()
  })

  it('user does not see admin links', () => {
    render(<DashboardPure role="user" />)
    expect(screen.getByText('Browse books')).toBeInTheDocument()
    expect(screen.getByText('View reservations')).toBeInTheDocument()
    expect(screen.queryByText('Manage users')).not.toBeInTheDocument()
  })
})
