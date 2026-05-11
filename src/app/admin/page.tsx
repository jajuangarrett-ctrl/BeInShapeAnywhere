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
  clientNote: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

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

  const startEditNote = (prog: Program) => {
    setEditingNoteId(prog.id)
    setNoteDraft(prog.clientNote || '')
  }

  const cancelEditNote = () => {
    setEditingNoteId(null)
    setNoteDraft('')
  }

  const saveNote = async (id: string) => {
    setSavingNote(true)
    await fetch(`/api/programs/${id}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientNote: noteDraft }),
    })
    setSavingNote(false)
    setEditingNoteId(null)
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
              <p style={{ color: 'var(--brand-muted)', fontSize: '13px', margin: '0 0 12px', lineHeight: 1.4 }}>
                {prog.totalWeeks ? `${prog.totalWeeks} weeks` : 'No duration set'}
                {prog.description && ` — ${prog.description.slice(0, 80)}${prog.description.length > 80 ? '...' : ''}`}
              </p>

              {/* Client Note quick-edit */}
              <div style={{
                background: 'rgba(74, 222, 128, 0.06)',
                border: '1px solid rgba(74, 222, 128, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📝 Note to Client
                  </span>
                  {editingNoteId !== prog.id && (
                    <button
                      onClick={() => startEditNote(prog)}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      {prog.clientNote ? 'Edit' : '+ Add'}
                    </button>
                  )}
                </div>
                {editingNoteId === prog.id ? (
                  <>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Quick update for your client (e.g. 'Great work this week — push for one more rep on every set!')"
                      rows={3}
                      style={{
                        width: '100%',
                        background: 'var(--brand-bg)',
                        border: '1px solid var(--brand-border)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: 'inherit',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={cancelEditNote}
                        disabled={savingNote}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNote(prog.id)}
                        disabled={savingNote}
                        style={{
                          background: 'var(--brand-green)',
                          color: 'var(--brand-bg)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: savingNote ? 'wait' : 'pointer',
                        }}
                      >
                        {savingNote ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: prog.clientNote ? 'inherit' : 'var(--brand-muted)', fontStyle: prog.clientNote ? 'normal' : 'italic' }}>
                    {prog.clientNote || 'No note yet — click Add to leave one for your client.'}
                  </p>
                )}
              </div>

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
