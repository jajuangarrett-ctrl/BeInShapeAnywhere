'use client'

import { useState, useMemo } from 'react'

interface Exercise {
  id: string
  name: string
  videoUrl: string
  muscleGroup: string[]
  exerciseCategory: string[]
  equipment: string[]
  notes: string
}

interface ExerciseLibraryProps {
  exercises: Exercise[]
  onAddToDay: (exercise: Exercise, dayIndex: number) => void
  days: string[]
}

export default function ExerciseLibrary({ exercises, onAddToDay, days }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('All')
  const [addingExercise, setAddingExercise] = useState<Exercise | null>(null)

  const categories = useMemo(() => {
    const cats = new Set<string>()
    exercises.forEach(e => e.exerciseCategory?.forEach(c => cats.add(c)))
    return ['All', ...Array.from(cats).sort()]
  }, [exercises])

  const filtered = useMemo(() => {
    return exercises.filter(e => {
      const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'All' || e.exerciseCategory?.includes(filterCategory)
      return matchesSearch && matchesCategory
    })
  }, [exercises, search, filterCategory])

  const handleAddClick = (exercise: Exercise) => {
    setAddingExercise(exercise)
  }

  const handleDaySelect = (dayIndex: number) => {
    if (addingExercise) {
      onAddToDay(addingExercise, dayIndex)
      setAddingExercise(null)
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px', color: 'var(--brand-green)' }}>
        Exercise Library ({filtered.length})
      </h3>

      {/* Search */}
      <input
        className="input-field"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '8px', fontSize: '13px' }}
      />

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '11px',
              cursor: 'pointer',
              background: filterCategory === cat ? 'rgba(74, 222, 128, 0.2)' : 'var(--brand-card)',
              color: filterCategory === cat ? 'var(--brand-green)' : 'var(--brand-muted)',
              fontWeight: filterCategory === cat ? 600 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Day selector popup */}
      {addingExercise && (
        <div style={{
          background: 'var(--brand-card)',
          border: '1px solid var(--brand-green)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
        }}>
          <p style={{ fontSize: '12px', margin: '0 0 8px', color: 'var(--brand-green)' }}>
            Add "{addingExercise.name}" to:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {days.map((day, i) => (
              <button
                key={day}
                onClick={() => handleDaySelect(i)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--brand-border)',
                  background: 'transparent',
                  color: 'var(--brand-text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left',
                }}
              >
                {day}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAddingExercise(null)}
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

      {/* Exercise list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map(exercise => (
          <div
            key={exercise.id}
            className="exercise-card"
            onClick={() => handleAddClick(exercise)}
            style={{
              background: 'var(--brand-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            {/* Thumbnail */}
            {exercise.videoUrl ? (
              <img
                src={exercise.videoUrl}
                alt={exercise.name}
                className="gif-thumbnail"
                style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                background: 'var(--brand-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                🏋️
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {exercise.name}
              </p>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                {exercise.muscleGroup?.slice(0, 2).map(mg => (
                  <span key={mg} className="tag" style={{ fontSize: '10px', padding: '1px 5px' }}>{mg}</span>
                ))}
              </div>
            </div>

            <span style={{ color: 'var(--brand-green)', fontSize: '18px', flexShrink: 0 }}>+</span>
          </div>
        ))}
      </div>
    </div>
  )
}
