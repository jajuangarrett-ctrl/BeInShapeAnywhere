'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/useIsMobile'

interface Program {
  id: string
  name: string
  client: string
  totalWeeks: number | null
  published: boolean
  description: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) {
      router.push('/')
      return
    }
    fetchPrograms()
  }, [router])

  const fetchPrograms = async () => {
    const res = await fetch('/api/programs')
    const data = await res.json()
    setPrograms(data)
    setLoading(false)
  }

  const togglePublish = async (id: string, published: boolean) => {
    await fetch(`/api/programs/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    })
    fetchPrograms()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '16px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '16px' : '12px',
        marginBottom: isMobile ? '20px' : '32px',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0 }}>
            🏋️ BeInShape<span style={{ color: 'var(--brand-green)' }}>Anywhere</span>
          </h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: '14px', margin: '4px 0 0' }}>Trainer Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" style={{ flex: isMobile ? 1 : undefined }} onClick={() => router.push('/admin/builder')}>
            + New Program
          </button>
          <button className="btn-secondary" style={{ flex: isMobile ? 1 : undefined }} onClick={() => { sessionStorage.removeItem('admin_auth'); router.push('/') }}>
            Logout
          </button>
        </div>
      </div>

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brand-muted)' }}>
          <p style={{ fontSize: '18px' }}>No programs yet</p>
          <p>Click "New Program" to create your first workout program</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {programs.map((prog) => (
            <div
              key={prog.id}
              style={{
                background: 'var(--brand-card)',
                border: '1px solid var(--brand-border)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Published indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: prog.published ? 'var(--brand-green)' : 'var(--brand-border)',
                }}
                title={prog.published ? 'Published' : 'Draft'}
              />

              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px', paddingRight: '24px' }}>{prog.name}</h3>
              <p style={{ color: 'var(--brand-green)', fontSize: '14px', margin: '0 0 8px' }}>{prog.client}</p>
              <p style={{ color: 'var(--brand-muted)', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.4 }}>
                {prog.totalWeeks ? `${prog.totalWeeks} weeks` : 'No duration set'}
                {prog.description && ` — ${prog.description.slice(0, 80)}${prog.description.length > 80 ? '...' : ''}`}
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 14px', flex: 1 }}
                  onClick={() => router.push(`/admin/builder?program=${prog.id}`)}
                >
                  Edit Workouts
                </button>
                <button
                  className="btn-secondary"
                  style={{
                    fontSize: '13px',
                    padding: '8px 14px',
                    borderColor: prog.published ? '#F87171' : 'var(--brand-green)',
                    color: prog.published ? '#F87171' : 'var(--brand-green)',
                  }}
                  onClick={() => togglePublish(prog.id, prog.published)}
                >
                  {prog.published ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
