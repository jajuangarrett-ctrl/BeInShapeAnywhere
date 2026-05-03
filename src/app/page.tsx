'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'admin' | 'client'>('select')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('admin_auth', 'true')
        router.push('/admin')
      } else {
        setError('Invalid admin password')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.program) {
        sessionStorage.setItem('client_program', JSON.stringify(data.program))
        router.push('/workout')
      } else {
        setError('Invalid workout code')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            BeInShape<span style={{ color: 'var(--brand-green)' }}>Anywhere</span>
          </h1>
          <p style={{ color: 'var(--brand-muted)', marginTop: '8px', fontSize: '14px' }}>
            Your personal training platform
          </p>
        </div>

        {mode === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-primary" onClick={() => setMode('client')} style={{ fontSize: '16px', padding: '14px' }}>
              Access My Workouts
            </button>
            <button className="btn-secondary" onClick={() => setMode('admin')} style={{ fontSize: '14px', padding: '12px' }}>
              Trainer Login
            </button>
          </div>
        )}

        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(s => !s)}
              placeholder="Admin password"
            />
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || !password} style={{ fontSize: '16px', padding: '14px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => { setMode('select'); setError(''); setPassword(''); setShowPassword(false) }}>
              Back
            </button>
          </form>
        )}

        {mode === 'client' && (
          <form onSubmit={handleClientLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(s => !s)}
              placeholder="Enter your workout code"
            />
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || !password} style={{ fontSize: '16px', padding: '14px' }}>
              {loading ? 'Loading...' : 'View My Workouts'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => { setMode('select'); setError(''); setPassword(''); setShowPassword(false) }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function PasswordField({
  value, onChange, show, onToggle, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input-field"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        style={{ textAlign: 'center', fontSize: '16px', padding: '14px', paddingRight: '64px' }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'var(--brand-muted)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          padding: '6px 10px',
          borderRadius: '6px',
          letterSpacing: '0.5px',
        }}
      >
        {show ? 'HIDE' : 'SHOW'}
      </button>
    </div>
  )
}
