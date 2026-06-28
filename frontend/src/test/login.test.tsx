import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('All fields are required')
      return
    }
    onLogin(username, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        aria-label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div role="alert">{error}</div>}
      <button type="submit">Sign In</button>
    </form>
  )
}

describe('Login', () => {
  it('renders form fields', () => {
    render(<LoginForm onLogin={() => {}} />)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('shows error with empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm onLogin={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getByRole('alert')).toHaveTextContent('All fields are required')
  })

  it('calls onLogin with credentials', async () => {
    const user = userEvent.setup()
    let capturedUser = ''
    let capturedPass = ''
    render(
      <LoginForm
        onLogin={(u, p) => {
          capturedUser = u
          capturedPass = p
        }}
      />,
    )
    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(capturedUser).toBe('admin')
    expect(capturedPass).toBe('admin123')
  })
})
