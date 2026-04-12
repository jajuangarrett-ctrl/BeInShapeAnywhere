'use client'

import { useState } from 'react'

interface BuilderEntry {
  tempId: string
  exerciseId: string
  exerciseName: string
  videoUrl: string
  muscleGroup: string[]
  equipment: string[]
  sets: number
  reps: string
  restSec: number
  supersetGroup: string | null
  weightLoad: string
  notes: string
}

interface DayWorkout {
  day: string
  entries: BuilderEntry[]
}

interface WeekDayGridProps {
  days: DayWorkout[]
  onUpdateDays: (days: DayWorkout[]) => void
  onRemoveEntry: (dayIndex: number, tempId: string) => void
  onUpdateEntry: (dayIndex: number, tempId: string, updates: Partial<BuilderEntry>) => void
}

const SUPERSET_COLORS: Record<string, string> = {
  A: '#4ADE80',
  B: '#60A5FA',
  C: '#C084FC',
  D: '#FB923C',
  E: '#F87171',
}

const DAY_COLORS: Record<string, string> = {
  Monday: '#60A5FA',
  Tuesday: '#4ADE80',
  Wednesday: '#C084FC',
  Thursday: '#FB923C',
  Friday: '#F87171',
  Saturday: '#FACC15',
  Sunday: '#a3a3a3',
}

export default function WeekDayGrid({ days, onUpdateDays, onRemoveEntry, onUpdateEntry }: WeekDayGridProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const moveEntry = (dayIndex: number, fromIdx: number, toIdx: number) => {
    const newDays = [...days]
    const entries = [...newDays[dayIndex].entries]
    const [moved] = entries.splice(fromIdx, 1)
    entries.splice(toIdx, 0, moved)
    newDays[dayIndex] = { ...newDays[dayIndex], entries }
    onUpdateDays(newDays)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {days.map((dayWorkout, dayIdx) => (
        <div
          key={dayWorkout.day}
          style={{
            background: 'var(--brand-card)',
            border: '1px solid var(--brand-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Day header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: dayWorkout.entries.length > 0 ? '1px solid var(--brand-border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: DAY_COLORS[dayWorkout.day] || '#666',
              }} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{dayWorkout.day}</span>
              <span style={{ color: 'var(--brand-muted)', fontSize: '12px' }}>
                {dayWorkout.entries.length} exercise{dayWorkout.entries.length !== 1 ? 's' : ''}
              </span>
            </div>
            {dayWorkout.entries.length > 0 && (
              <span style={{ color: 'var(--brand-muted)', fontSize: '11px' }}>
                {dayWorkout.entries.reduce((sum, e) => sum + e.sets, 0)} total sets
              </span>
            )}
          </div>

          {/* Exercises */}
          {dayWorkout.entries.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--brand-muted)', fontSize: '12px', fontStyle: 'italic' }}>
              No exercises — add from the library on the left
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {dayWorkout.entries.map((entry, entryIdx) => {
                const isExpanded = expandedEntry === entry.tempId
                const ssColor = entry.supersetGroup ? SUPERSET_COLORS[entry.supersetGroup] : undefined

                return (
                  <div
                    key={entry.tempId}
                    style={{
                      position: 'relative',
                      padding: '10px 10px 10px 16px',
                      marginBottom: '4px',
                      borderRadius: '8px',
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                      borderLeft: ssColor ? `3px solid ${ssColor}` : '3px solid transparent',
                    }}
                  >
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Reorder buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          disabled={entryIdx === 0}
                          onClick={() => moveEntry(dayIdx, entryIdx, entryIdx - 1)}
                          style={{ background: 'none', border: 'none', color: entryIdx === 0 ? '#333' : 'var(--brand-muted)', cursor: entryIdx === 0 ? 'default' : 'pointer', fontSize: '10px', padding: '2px' }}
                        >▲</button>
                        <button
                          disabled={entryIdx === dayWorkout.entries.length - 1}
                          onClick={() => moveEntry(dayIdx, entryIdx, entryIdx + 1)}
                          style={{ background: 'none', border: 'none', color: entryIdx === dayWorkout.entries.length - 1 ? '#333' : 'var(--brand-muted)', cursor: entryIdx === dayWorkout.entries.length - 1 ? 'default' : 'pointer', fontSize: '10px', padding: '2px' }}
                        >▼</button>
                      </div>

                      {/* Thumbnail */}
                      {entry.videoUrl ? (
                        <img src={entry.videoUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏋️</div>
                      )}

                      {/* Name and quick stats */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.exerciseName}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--brand-muted)', margin: '2px 0 0' }}>
                          {entry.sets} × {entry.reps}{entry.weightLoad ? ` @ ${entry.weightLoad}` : ''}{entry.restSec ? ` · ${entry.restSec}s rest` : ''}
                        </p>
                      </div>

                      {/* Superset badge */}
                      {entry.supersetGroup && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${ssColor}22`,
                          color: ssColor,
                        }}>
                          SS-{entry.supersetGroup}
                        </span>
                      )}

                      {/* Expand/collapse */}
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.tempId)}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-muted)', cursor: 'pointer', fontSize: '12px', padding: '4px' }}
                      >
                        {isExpanded ? '▾' : '▸'}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => onRemoveEntry(dayIdx, entry.tempId)}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Expanded edit fields */}
                    {isExpanded && (
                      <div style={{ marginTop: '10px', paddingLeft: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Sets</label>
                          <input
                            className="input-field"
                            type="number"
                            value={entry.sets}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { sets: parseInt(e.target.value) || 1 })}
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Reps</label>
                          <input
                            className="input-field"
                            value={entry.reps}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { reps: e.target.value })}
                            placeholder="10, 8-12, AMRAP"
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Rest (sec)</label>
                          <input
                            className="input-field"
                            type="number"
                            value={entry.restSec}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { restSec: parseInt(e.target.value) || 0 })}
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Weight / Load</label>
                          <input
                            className="input-field"
                            value={entry.weightLoad}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { weightLoad: e.target.value })}
                            placeholder="30 lbs, bodyweight"
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Superset</label>
                          <select
                            className="input-field"
                            value={entry.supersetGroup || ''}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { supersetGroup: e.target.value || null })}
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          >
                            <option value="">None</option>
                            <option value="A">Group A</option>
                            <option value="B">Group B</option>
                            <option value="C">Group C</option>
                            <option value="D">Group D</option>
                            <option value="E">Group E</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '10px', color: 'var(--brand-muted)', display: 'block', marginBottom: '3px' }}>Coaching Notes</label>
                          <input
                            className="input-field"
                            value={entry.notes}
                            onChange={e => onUpdateEntry(dayIdx, entry.tempId, { notes: e.target.value })}
                            placeholder="Form cues, tips..."
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
