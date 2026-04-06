'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'admin' | 'client'>('select')
  const [password, setPassword] = useState('')
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
            <input
              className="input-field"
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ textAlign: 'center', fontSize: '16px', padding: '14px' }}
            />
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || !password} style={{ fontSize: '16px', padding: '14px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => { setMode('select'); setError(''); setPassword('') }}>
              Back
            </button>
          </form>
        )}

        {mode === 'client' && (
          <form onSubmit={handleClientLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="input-field"
              type="password"
              placeholder="Enter your workout code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ textAlign: 'center', fontSize: '16px', padding: '14px' }}
            />
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading || !password} style={{ fontSize: '16px', padding: '14px' }}>
              {loading ? 'Loading...' : 'View My Workouts'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => { setMode('select'); setError(''); setPassword('') }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
