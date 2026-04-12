'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Exercise {
  id: string
  name: string
  videoUrl: string
  muscleGroup: string[]
  equipment: string[]
}

interface WorkoutEntry {
  id: string
  entryName: string
  exerciseId: string
  week: number
  day: string
  order: number
  sets: number | null
  reps: string
  restSec: number | null
  supersetGroup: string | null
  weightLoad: string
  notes: string
  completed: boolean
  exercise?: Exercise
}

interface Program {
  id: string
  name: string
  client: string
  totalWeeks: number | null
  description: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const SUPERSET_COLORS: Record<string, string> = {
  A: '#4ADE80', B: '#60A5FA', C: '#C084FC', D: '#FB923C', E: '#F87171',
}

export default function WorkoutPage() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [currentDay, setCurrentDay] = useState<string>('')
  const [movingDay, setMovingDay] = useState(false)
  const [movingLoading, setMovingLoading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('client_program')
    if (!stored) {
      router.push('/')
      return
    }
    const prog = JSON.parse(stored) as Program
    setProgram(prog)

    fetch(`/api/programs/${prog.id}/entries`)
      .then(res => res.json())
      .then(data => {
        setEntries(data)
        setLoading(false)
        // Set initial day to first day with exercises
        const week1Days = data.filter((e: WorkoutEntry) => e.week === 1)
        if (week1Days.length > 0) {
          const firstDay = DAYS.find(d => week1Days.some((e: WorkoutEntry) => e.day === d))
          if (firstDay) setCurrentDay(firstDay)
        }
      })
  }, [router])

  const weeks = useMemo(() => {
    if (!program?.totalWeeks) return [1]
    return Array.from({ length: program.totalWeeks }, (_, i) => i + 1)
  }, [program])

  const activeDays = useMemo(() => {
    return DAYS.filter(d => entries.some(e => e.week === currentWeek && e.day === d))
  }, [entries, currentWeek])

  const todaysEntries = useMemo(() => {
    return entries
      .filter(e => e.week === currentWeek && e.day === currentDay)
      .sort((a, b) => a.order - b.order)
  }, [entries, currentWeek, currentDay])

  // Group entries by superset
  const groupedEntries = useMemo(() => {
    const groups: { supersetGroup: string | null; entries: WorkoutEntry[] }[] = []
    let currentGroup: { supersetGroup: string | null; entries: WorkoutEntry[] } | null = null

    for (const entry of todaysEntries) {
      if (entry.supersetGroup) {
        if (currentGroup && currentGroup.supersetGroup === entry.supersetGroup) {
          currentGroup.entries.push(entry)
        } else {
          currentGroup = { supersetGroup: entry.supersetGroup, entries: [entry] }
          groups.push(currentGroup)
        }
      } else {
        currentGroup = null
        groups.push({ supersetGroup: null, entries: [entry] })
      }
    }
    return groups
  }, [todaysEntries])

  const toggleCompleted = async (entryId: string, completed: boolean) => {
    if (!program) return
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, completed } : e))
    try {
      await fetch(`/api/programs/${program.id}/entries/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, completed }),
      })
    } catch {
      // Revert on error
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, completed: !completed } : e))
    }
  }

  const moveWorkoutToDay = async (toDay: string) => {
    if (!program || toDay === currentDay) return
    setMovingLoading(true)
    try {
      await fetch(`/api/programs/${program.id}/entries/move-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: currentWeek, fromDay: currentDay, toDay }),
      })
      // Update local state
      setEntries(prev => prev.map(e =>
        e.week === currentWeek && e.day === currentDay ? { ...e, day: toDay } : e
      ))
      setCurrentDay(toDay)
    } catch (err) {
      console.error('Error moving workout:', err)
    }
    setMovingLoading(false)
    setMovingDay(false)
  }

  const completedCount = todaysEntries.filter(e => e.completed).length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--brand-muted)' }}>Loading your workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: '600px', margin: '0 auto', padding: '0 16px 80px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
          {program?.name}
        </h1>
        <p style={{ color: 'var(--brand-green)', fontSize: '14px', margin: 0 }}>
          {program?.client}
        </p>
        {program?.description && (
          <p style={{ color: 'var(--brand-muted)', fontSize: '13px', marginTop: '8px', lineHeight: 1.5 }}>
            {program.description}
          </p>
        )}
      </div>

      {/* Week selector */}
      {weeks.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          {weeks.map(w => (
            <button
              key={w}
              onClick={() => { setCurrentWeek(w); setCurrentDay(''); setMovingDay(false) }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: currentWeek === w ? '1px solid var(--brand-green)' : '1px solid var(--brand-border)',
                background: currentWeek === w ? 'rgba(74, 222, 128, 0.15)' : 'var(--brand-card)',
                color: currentWeek === w ? 'var(--brand-green)' : 'var(--brand-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: currentWeek === w ? 600 : 400,
              }}
            >
              Week {w}
            </button>
          ))}
        </div>
      )}

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', padding: '2px 0' }}>
        {DAYS.map(d => {
          const hasExercises = activeDays.includes(d)
          const isActive = currentDay === d
          return (
            <button
              key={d}
              onClick={() => { if (hasExercises) { setCurrentDay(d); setMovingDay(false) } }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--brand-green)' : hasExercises ? 'var(--brand-card)' : 'transparent',
                color: isActive ? '#000' : hasExercises ? 'var(--brand-text)' : '#333',
                cursor: hasExercises ? 'pointer' : 'default',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: '52px',
                textAlign: 'center',
              }}
            >
              {DAY_SHORT[d]}
            </button>
          )
        })}
      </div>

      {/* Workout content */}
      {!currentDay ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--brand-muted)' }}>
          <p>Select a day to view your workout</p>
        </div>
      ) : todaysEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--brand-muted)' }}>
          <p style={{ fontSize: '18px' }}>Rest Day</p>
          <p>No exercises scheduled for {currentDay}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Day summary + move button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{currentDay}</span>
              {completedCount > 0 && (
                <span style={{ color: 'var(--brand-green)', fontSize: '12px', marginLeft: '8px' }}>
                  {completedCount}/{todaysEntries.length} done
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--brand-muted)', fontSize: '13px' }}>
                {todaysEntries.length} exercises
              </span>
              <button
                onClick={() => setMovingDay(!movingDay)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-border)',
                  background: movingDay ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                  color: movingDay ? 'var(--brand-green)' : 'var(--brand-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                Move Day
              </button>
            </div>
          </div>

          {/* Day move selector */}
          {movingDay && (
            <div style={{
              background: 'var(--brand-card)',
              border: '1px solid var(--brand-green)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--brand-green)', margin: '0 0 8px' }}>
                Move this workout to:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DAYS.filter(d => d !== currentDay).map(d => (
                  <button
                    key={d}
                    disabled={movingLoading}
                    onClick={() => moveWorkoutToDay(d)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--brand-border)',
                      background: 'transparent',
                      color: 'var(--brand-text)',
                      cursor: movingLoading ? 'wait' : 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMovingDay(false)}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  border: 'none',
                  background: 'none',
                  color: 'var(--brand-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Exercise groups */}
          {groupedEntries.map((group, gi) => {
            const isSuperset = group.supersetGroup && group.entries.length > 1
            const ssColor = group.supersetGroup ? SUPERSET_COLORS[group.supersetGroup] : undefined

            return (
              <div key={gi}>
                {/* Superset label */}
                {isSuperset && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                    marginBottom: '4px',
                  }}>
                    <div style={{ width: '18px', height: '2px', background: ssColor, borderRadius: '1px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: ssColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Superset {group.supersetGroup}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: `${ssColor}33` }} />
                  </div>
                )}

                {/* Exercise cards */}
                <div style={{
                  borderLeft: isSuperset ? `3px solid ${ssColor}` : '3px solid transparent',
                  paddingLeft: isSuperset ? '12px' : '0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {group.entries.map(entry => (
                    <ExerciseCard
                      key={entry.id}
                      entry={entry}
                      onToggleCompleted={toggleCompleted}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Logout */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button
          className="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick={() => { sessionStorage.removeItem('client_program'); router.push('/') }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

function ExerciseCard({ entry, onToggleCompleted }: {
  entry: WorkoutEntry
  onToggleCompleted: (entryId: string, completed: boolean) => void
}) {
  const [showVideo, setShowVideo] = useState(false)
  const videoUrl = entry.exercise?.videoUrl || ''

  return (
    <div style={{
      background: 'var(--brand-card)',
      border: entry.completed ? '1px solid var(--brand-green)' : '1px solid var(--brand-border)',
      borderRadius: '12px',
      padding: '14px',
      opacity: entry.completed ? 0.75 : 1,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Completion checkbox */}
        <button
          onClick={() => onToggleCompleted(entry.id, !entry.completed)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: entry.completed ? '2px solid var(--brand-green)' : '2px solid var(--brand-border)',
            background: entry.completed ? 'var(--brand-green)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
            transition: 'all 0.2s',
          }}
        >
          {entry.completed && (
            <span style={{ color: '#000', fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>&#10003;</span>
          )}
        </button>

        {/* Thumbnail */}
        <div
          onClick={() => videoUrl && setShowVideo(!showVideo)}
          style={{ cursor: videoUrl ? 'pointer' : 'default', flexShrink: 0, position: 'relative' }}
        >
          {videoUrl ? (
            <>
              <img
                src={videoUrl}
                alt={entry.entryName}
                style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)', borderRadius: '10px', opacity: showVideo ? 0 : 1,
                transition: 'opacity 0.2s',
              }}>
                <span style={{ fontSize: '16px' }}>&#9654;</span>
              </div>
            </>
          ) : (
            <div style={{
              width: '56px', height: '56px', borderRadius: '10px',
              background: 'var(--brand-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            }}>&#127947;&#65039;</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 6px',
            textDecoration: entry.completed ? 'line-through' : 'none',
            color: entry.completed ? 'var(--brand-muted)' : 'var(--brand-text)',
          }}>
            {entry.entryName}
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {entry.sets && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green)', lineHeight: 1 }}>{entry.sets}</div>
                <div style={{ fontSize: '10px', color: 'var(--brand-muted)', marginTop: '2px' }}>SETS</div>
              </div>
            )}
            {entry.reps && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-green)', lineHeight: 1 }}>{entry.reps}</div>
                <div style={{ fontSize: '10px', color: 'var(--brand-muted)', marginTop: '2px' }}>REPS</div>
              </div>
            )}
            {entry.restSec ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-muted)', lineHeight: 1 }}>{entry.restSec}s</div>
                <div style={{ fontSize: '10px', color: 'var(--brand-muted)', marginTop: '2px' }}>REST</div>
              </div>
            ) : null}
          </div>
          {entry.weightLoad && (
            <p style={{ fontSize: '12px', color: 'var(--brand-green)', margin: '6px 0 0', fontWeight: 500 }}>
              {entry.weightLoad}
            </p>
          )}
          {entry.notes && (
            <p style={{ fontSize: '12px', color: 'var(--brand-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
              {entry.notes}
            </p>
          )}
        </div>
      </div>

      {/* Expanded video/GIF */}
      {showVideo && videoUrl && (
        <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
          {videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? (
            <iframe
              src={videoUrl.replace('watch?v=', 'embed/')}
              style={{ width: '100%', height: '240px', border: 'none' }}
              allowFullScreen
            />
          ) : (
            <img src={videoUrl} alt={entry.entryName} style={{ width: '100%', height: 'auto', display: 'block' }} />
          )}
        </div>
      )}
    </div>
  )
}
