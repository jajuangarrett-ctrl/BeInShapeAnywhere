'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutCalendar from '@/components/WorkoutCalendar'

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
  exercise?: Exercise
}

interface Program {
  id: string
  name: string
  client: string
  totalWeeks: number | null
  description: string
  clientNote: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
}

const SUPERSET_COLORS: Record<string, string> = {
  A: '#4ADE80', B: '#60A5FA', C: '#C084FC', D: '#FB923C', E: '#F87171',
}

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {}
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

  // Set completion tracking: entryId → [set0done, set1done, ...]
  const [setStates, setSetStates] = useState<Record<string, boolean[]>>({})
  // Per-exercise notes
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  // Rest timer
  const [restTimer, setRestTimer] = useState({ active: false, seconds: 0 })
  // Workout session
  const startTimeRef = useRef<number>(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [doneStats, setDoneStats] = useState({ duration: 0, sets: 0 })

  // Rest timer: tick down one second at a time using recursive setTimeout
  useEffect(() => {
    if (!restTimer.active || restTimer.seconds <= 0) return
    const id = setTimeout(() => {
      setRestTimer(prev => {
        if (!prev.active || prev.seconds <= 1) {
          playBeep()
          return { active: false, seconds: 0 }
        }
        return { ...prev, seconds: prev.seconds - 1 }
      })
    }, 1000)
    return () => clearTimeout(id)
  }, [restTimer.active, restTimer.seconds])

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

        // Initialize set states and notes for all entries
        const initialStates: Record<string, boolean[]> = {}
        const initialNotes: Record<string, string> = {}
        data.forEach((e: WorkoutEntry) => {
          initialStates[e.id] = Array(e.sets || 0).fill(false)
          initialNotes[e.id] = ''
        })
        setSetStates(initialStates)
        setExerciseNotes(initialNotes)
        startTimeRef.current = Date.now()

        setLoading(false)
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

  // Progress for today's workout
  const totalSets = useMemo(
    () => todaysEntries.reduce((s, e) => s + (e.sets || 0), 0),
    [todaysEntries]
  )
  const completedSets = useMemo(
    () => todaysEntries.reduce((total, e) => total + (setStates[e.id]?.filter(Boolean).length || 0), 0),
    [todaysEntries, setStates]
  )

  function toggleSet(entryId: string, index: number) {
    const wasChecked = setStates[entryId]?.[index]
    setSetStates(prev => {
      const current = [...(prev[entryId] || [])]
      current[index] = !current[index]
      return { ...prev, [entryId]: current }
    })
    // Start rest timer when checking off (not unchecking)
    const entry = entries.find(e => e.id === entryId)
    if (!wasChecked && entry?.restSec) {
      setRestTimer({ active: true, seconds: entry.restSec })
    }
  }

  function skipTimer() {
    setRestTimer({ active: false, seconds: 0 })
  }

  async function completeWorkout() {
    if (!program) return
    setSubmitting(true)
    try {
      const durationMin = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
      const notes = Object.entries(exerciseNotes)
        .filter(([, note]) => note.trim())
        .map(([id, note]) => {
          const entry = entries.find(e => e.id === id)
          return `${entry?.entryName || 'Exercise'}: ${note}`
        })
        .join(' | ')

      await fetch('/api/workout-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program.id,
          programName: program.name,
          completedAt: new Date().toISOString(),
          durationMin,
          setsCompleted: completedSets,
          totalSets,
          notes,
          prs: [],
        }),
      })
      setDoneStats({ duration: durationMin, sets: completedSets })
      setDone(true)
    } catch (err) {
      console.error('Error completing workout:', err)
    } finally {
      setSubmitting(false)
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

  // Workout complete screen
  if (done) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          {/* Trophy icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '2px solid var(--brand-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '36px',
          }}>
            &#127942;
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>
            Workout Complete!
          </h1>
          <p style={{ color: 'var(--brand-muted)', fontSize: '16px', margin: '0 0 32px' }}>
            Great work, {program?.client}!
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '32px',
          }}>
            <div style={{
              background: 'var(--brand-card)', border: '1px solid var(--brand-border)',
              borderRadius: '12px', padding: '16px 24px', flex: 1,
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-green)' }}>
                {doneStats.sets}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-muted)', marginTop: '2px' }}>SETS DONE</div>
            </div>
            <div style={{
              background: 'var(--brand-card)', border: '1px solid var(--brand-border)',
              borderRadius: '12px', padding: '16px 24px', flex: 1,
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand-green)' }}>
                {doneStats.duration}m
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-muted)', marginTop: '2px' }}>DURATION</div>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: '12px', fontSize: '15px', padding: '14px' }}
            onClick={() => setDone(false)}
          >
            Back to Program
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%', fontSize: '13px' }}
            onClick={() => { sessionStorage.removeItem('client_program'); router.push('/') }}
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: '600px', margin: '0 auto', padding: '0 16px 120px' }}>
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

      {/* Trainer's note callout */}
      {program?.clientNote && (
        <div style={{
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid rgba(74, 222, 128, 0.4)',
          borderLeft: '4px solid var(--brand-green)',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--brand-green)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: '6px',
          }}>
            📝 Note from your trainer
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {program.clientNote}
          </p>
        </div>
      )}

      {/* Training overview — shows when a day is selected */}
      {currentDay && totalSets > 0 && (
        <div style={{
          background: 'var(--brand-card)',
          border: '1px solid var(--brand-border)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {completedSets === totalSets && totalSets > 0 ? '✓ All sets complete' : 'Progress'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--brand-green)', fontWeight: 700 }}>
              {completedSets} / {totalSets} sets
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            height: '6px', borderRadius: '3px',
            background: 'var(--brand-border)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%`,
              background: completedSets === totalSets ? 'var(--brand-green)' : 'var(--brand-green)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

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
          // Show a dot indicator if exercises for this day are partially completed
          const dayEntries = entries.filter(e => e.week === currentWeek && e.day === d)
          const dayCompleted = dayEntries.length > 0 &&
            dayEntries.every(e => (setStates[e.id] || []).every(Boolean) && (setStates[e.id] || []).length > 0)
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
                position: 'relative',
              }}
            >
              {DAY_SHORT[d]}
              {dayCompleted && !isActive && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--brand-green)',
                }} />
              )}
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
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{currentDay}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--brand-muted)', fontSize: '13px' }}>
                {todaysEntries.length} exercises · {totalSets} sets
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
                  marginTop: '8px', padding: '4px 8px',
                  border: 'none', background: 'none',
                  color: 'var(--brand-muted)', cursor: 'pointer', fontSize: '11px',
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
                {isSuperset && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 0', marginBottom: '4px',
                  }}>
                    <div style={{ width: '18px', height: '2px', background: ssColor, borderRadius: '1px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: ssColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Superset {group.supersetGroup}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: `${ssColor}33` }} />
                  </div>
                )}

                <div style={{
                  borderLeft: isSuperset ? `3px solid ${ssColor}` : '3px solid transparent',
                  paddingLeft: isSuperset ? '12px' : '0',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  {group.entries.map(entry => (
                    <ExerciseCard
                      key={entry.id}
                      entry={entry}
                      setChecked={setStates[entry.id] || []}
                      onToggleSet={(idx) => toggleSet(entry.id, idx)}
                      onStartTimer={(sec) => setRestTimer({ active: true, seconds: sec })}
                      note={exerciseNotes[entry.id] || ''}
                      onNoteChange={(note) => setExerciseNotes(prev => ({ ...prev, [entry.id]: note }))}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Complete Workout button — shows only when all sets are checked */}
          {completedSets === totalSets && totalSets > 0 && (
            <div style={{ marginTop: '24px' }}>
              <button
                className="btn-primary"
                onClick={completeWorkout}
                disabled={submitting}
                style={{ width: '100%', fontSize: '16px', padding: '16px', borderRadius: '12px' }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Logging...
                  </span>
                ) : 'Complete Workout ✓'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workout history calendar */}
      {program && <WorkoutCalendar programId={program.id} />}

      {/* Logout */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button
          className="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick={() => { sessionStorage.removeItem('client_program'); router.push('/') }}
        >
          Logout
        </button>
      </div>

      {/* Rest timer — fixed floating bar at bottom */}
      {restTimer.active && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--brand-card)',
          borderTop: '2px solid var(--brand-green)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(74, 222, 128, 0.15)',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--brand-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
              REST
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brand-green)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {String(Math.floor(restTimer.seconds / 60)).padStart(2, '0')}:{String(restTimer.seconds % 60).padStart(2, '0')}
            </div>
          </div>
          {/* Simple countdown ring */}
          <button
            onClick={skipTimer}
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Skip
          </button>
        </div>
      )}
    </div>
  )
}

function ExerciseCard({
  entry,
  setChecked,
  onToggleSet,
  onStartTimer,
  note,
  onNoteChange,
}: {
  entry: WorkoutEntry
  setChecked: boolean[]
  onToggleSet: (index: number) => void
  onStartTimer: (seconds: number) => void
  note: string
  onNoteChange: (note: string) => void
}) {
  const [showVideo, setShowVideo] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const videoUrl = entry.exercise?.videoUrl || ''
  const numSets = entry.sets || 0

  function handleSetToggle(index: number) {
    const wasChecked = setChecked[index]
    onToggleSet(index)
    if (!wasChecked && entry.restSec) {
      onStartTimer(entry.restSec)
    }
  }

  return (
    <div style={{
      background: 'var(--brand-card)',
      border: '1px solid var(--brand-border)',
      borderRadius: '12px',
      padding: '14px',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
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
          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>{entry.entryName}</h4>
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

      {/* Set checkboxes */}
      {numSets > 0 && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--brand-muted)', fontWeight: 600, letterSpacing: '0.3px', minWidth: '28px' }}>
            SETS
          </span>
          {Array.from({ length: numSets }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleSetToggle(i)}
              style={{
                width: '40px', height: '40px',
                borderRadius: '8px',
                border: `2px solid ${setChecked[i] ? 'var(--brand-green)' : 'var(--brand-border)'}`,
                background: setChecked[i] ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                color: setChecked[i] ? 'var(--brand-green)' : 'var(--brand-muted)',
                cursor: 'pointer',
                fontSize: setChecked[i] ? '16px' : '14px',
                fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {setChecked[i] ? '✓' : i + 1}
            </button>
          ))}

          {/* Note button */}
          <button
            onClick={() => setShowNote(!showNote)}
            style={{
              height: '40px', padding: '0 12px',
              borderRadius: '8px',
              border: `1px solid ${note ? 'var(--brand-green)' : 'var(--brand-border)'}`,
              background: note ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
              color: note ? 'var(--brand-green)' : 'var(--brand-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {note ? 'Note ●' : '+ Note'}
          </button>
        </div>
      )}

      {/* Note textarea */}
      {showNote && (
        <textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="How did this feel? Weight used?"
          className="input-field"
          style={{ marginTop: '10px', resize: 'none', fontSize: '13px', height: '72px', lineHeight: 1.4 }}
        />
      )}

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
