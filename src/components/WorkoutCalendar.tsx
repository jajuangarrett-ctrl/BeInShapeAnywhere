'use client'

import { useState, useEffect } from 'react'

interface WorkoutLog {
  id: string
  completedAt: string
  durationMin: number
  setsCompleted: number
  totalSets: number
  notes: string
}

interface WorkoutCalendarProps {
  programId: string
}

export default function WorkoutCalendar({ programId }: WorkoutCalendarProps) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<WorkoutLog | null>(null)

  useEffect(() => {
    fetch(`/api/workout-history?programId=${programId}`)
      .then(res => res.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [programId])

  if (loading) return null
  if (logs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--brand-muted)', fontSize: '13px' }}>
      No workouts logged yet — complete your first session to see history here.
    </div>
  )

  // Build a set of completed dates for quick lookup
  const completedDates = new Set(
    logs.map(l => l.completedAt.slice(0, 10))
  )

  // Generate last 10 weeks of dates (Sunday–Saturday)
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())) // end of this week

  const weeks: Date[][] = []
  const cursor = new Date(endDate)
  cursor.setDate(cursor.getDate() - (10 * 7 - 1))
  cursor.setDate(cursor.getDate() - cursor.getDay()) // start of that week (Sunday)

  for (let w = 0; w < 10; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div style={{ marginTop: '32px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
        WORKOUT HISTORY
      </h3>

      {/* Day label row */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: '10px', color: 'var(--brand-muted)', fontWeight: 600,
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* Week grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          {week.map((date, di) => {
            const dateStr = date.toISOString().slice(0, 10)
            const isCompleted = completedDates.has(dateStr)
            const isFuture = date > today
            const log = logs.find(l => l.completedAt.slice(0, 10) === dateStr)

            return (
              <button
                key={di}
                onClick={() => isCompleted && log ? setSelected(selected?.id === log.id ? null : log) : undefined}
                title={isCompleted ? `Workout logged on ${date.toLocaleDateString()}` : undefined}
                style={{
                  flex: 1, aspectRatio: '1',
                  borderRadius: '3px',
                  border: 'none',
                  background: isCompleted
                    ? 'var(--brand-green)'
                    : isFuture
                      ? 'transparent'
                      : 'var(--brand-border)',
                  cursor: isCompleted ? 'pointer' : 'default',
                  opacity: isFuture ? 0.2 : 1,
                  transition: 'all 0.15s ease',
                  transform: selected?.id === log?.id ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            )
          })}
        </div>
      ))}

      {/* Selected log detail */}
      {selected && (
        <div style={{
          marginTop: '12px',
          background: 'var(--brand-card)',
          border: '1px solid var(--brand-green)',
          borderRadius: '10px',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {new Date(selected.completedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green)' }}>{selected.setsCompleted}</span>
              <span style={{ fontSize: '11px', color: 'var(--brand-muted)', marginLeft: '4px' }}>sets</span>
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green)' }}>{selected.durationMin}m</span>
              <span style={{ fontSize: '11px', color: 'var(--brand-muted)', marginLeft: '4px' }}>duration</span>
            </div>
          </div>
          {selected.notes && (
            <p style={{ fontSize: '12px', color: 'var(--brand-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
              {selected.notes}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--brand-muted)', textAlign: 'right' }}>
        {logs.length} session{logs.length !== 1 ? 's' : ''} logged
      </div>
    </div>
  )
}
