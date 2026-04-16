'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ExerciseLibrary from '@/components/admin/ExerciseLibrary'
import WeekDayGrid from '@/components/admin/WeekDayGrid'
import ProgramSettings from '@/components/admin/ProgramSettings'
import { useIsMobile } from '@/lib/useIsMobile'

export interface Exercise {
  id: string
  name: string
  videoUrl: string
  muscleGroup: string[]
  exerciseCategory: string[]
  equipment: string[]
  notes: string
}

export interface BuilderEntry {
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

export interface DayWorkout {
  day: string
  entries: BuilderEntry[]
}

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programId = searchParams.get('program')

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [weekPlans, setWeekPlans] = useState<Map<number, DayWorkout[]>>(new Map())
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(4)
  const [programName, setProgramName] = useState('')
  const [client, setClient] = useState('')
  const [password, setPassword] = useState('')
  const [description, setDescription] = useState('')
  const [clients, setClients] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [loadingProgram, setLoadingProgram] = useState(!!programId)
  const [showSettings, setShowSettings] = useState(!programId)
  const [savedProgramId, setSavedProgramId] = useState<string | null>(programId)
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const [copyFromWeek, setCopyFromWeek] = useState<number | ''>('')
  const isMobile = useIsMobile()

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const initWeek = useCallback((weekNum: number): DayWorkout[] => {
    return DAYS.map(day => ({ day, entries: [] }))
  }, [])

  // Fetch exercises
  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) {
      router.push('/')
      return
    }
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => { setExercises(data); setLoadingExercises(false) })
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
  }, [router])

  // Load existing program
  useEffect(() => {
    if (!programId) {
      const initial = new Map<number, DayWorkout[]>()
      initial.set(1, initWeek(1))
      setWeekPlans(initial)
      return
    }
    const loadProgram = async () => {
      const [progRes, entriesRes] = await Promise.all([
        fetch('/api/programs'),
        fetch(`/api/programs/${programId}/entries`),
      ])
      const programs = await progRes.json()
      const entries = await entriesRes.json()
      const prog = programs.find((p: any) => p.id === programId)
      if (prog) {
        setProgramName(prog.name)
        setClient(prog.client)
        setPassword(prog.password)
        setDescription(prog.description)
        setTotalWeeks(prog.totalWeeks || 4)
      }

      // Organize entries into week/day structure
      const plans = new Map<number, DayWorkout[]>()
      for (const entry of entries) {
        const week = entry.week || 1
        if (!plans.has(week)) {
          plans.set(week, initWeek(week))
        }
        const dayWorkouts = plans.get(week)!
        const dayIdx = DAYS.indexOf(entry.day)
        if (dayIdx >= 0) {
          dayWorkouts[dayIdx].entries.push({
            tempId: entry.id,
            exerciseId: entry.exerciseId,
            exerciseName: entry.entryName || entry.exercise?.name || '',
            videoUrl: entry.exercise?.videoUrl || '',
            muscleGroup: entry.exercise?.muscleGroup || [],
            equipment: entry.exercise?.equipment || [],
            sets: entry.sets || 3,
            reps: entry.reps || '10',
            restSec: entry.restSec || 30,
            supersetGroup: entry.supersetGroup,
            weightLoad: entry.weightLoad || '',
            notes: entry.notes || '',
          })
        }
      }

      // Ensure all weeks exist
      const maxWeek = prog?.totalWeeks || 4
      for (let w = 1; w <= maxWeek; w++) {
        if (!plans.has(w)) plans.set(w, initWeek(w))
      }
      if (plans.size === 0) plans.set(1, initWeek(1))

      setWeekPlans(plans)
      setLoadingProgram(false)
    }
    loadProgram()
  }, [programId, initWeek])

  const getCurrentDays = (): DayWorkout[] => {
    if (!weekPlans.has(currentWeek)) {
      const newDays = initWeek(currentWeek)
      setWeekPlans(prev => new Map(prev).set(currentWeek, newDays))
      return newDays
    }
    return weekPlans.get(currentWeek)!
  }

  const updateDays = (days: DayWorkout[]) => {
    setWeekPlans(prev => new Map(prev).set(currentWeek, days))
  }

  const addExerciseToDay = (exercise: Exercise, dayIndex: number) => {
    const days = [...getCurrentDays()]
    // Prevent duplicate exercises on the same day
    const alreadyExists = days[dayIndex].entries.some(e => e.exerciseId === exercise.id)
    if (alreadyExists) {
      alert(`"${exercise.name}" is already on ${days[dayIndex].day}. Duplicates are not allowed.`)
      return
    }
    const newEntry: BuilderEntry = {
      tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      videoUrl: exercise.videoUrl,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      sets: 3,
      reps: '10',
      restSec: 30,
      supersetGroup: null,
      weightLoad: '',
      notes: '',
    }
    days[dayIndex] = { ...days[dayIndex], entries: [...days[dayIndex].entries, newEntry] }
    updateDays(days)
  }

  const removeEntry = (dayIndex: number, tempId: string) => {
    const days = [...getCurrentDays()]
    days[dayIndex] = {
      ...days[dayIndex],
      entries: days[dayIndex].entries.filter(e => e.tempId !== tempId),
    }
    updateDays(days)
  }

  const updateEntry = (dayIndex: number, tempId: string, updates: Partial<BuilderEntry>) => {
    const days = [...getCurrentDays()]
    days[dayIndex] = {
      ...days[dayIndex],
      entries: days[dayIndex].entries.map(e =>
        e.tempId === tempId ? { ...e, ...updates } : e
      ),
    }
    updateDays(days)
  }

  const copyWeek = (fromWeek: number, toWeek: number) => {
    const sourceDays = weekPlans.get(fromWeek)
    if (!sourceDays) return
    const targetHasEntries = (weekPlans.get(toWeek) || []).some(d => d.entries.length > 0)
    if (targetHasEntries) {
      const ok = window.confirm(`Week ${toWeek} already has exercises. Replace them with a copy of Week ${fromWeek}?`)
      if (!ok) return
    }
    const copiedDays = sourceDays.map(day => ({
      ...day,
      entries: day.entries.map(e => ({
        ...e,
        tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      })),
    }))
    setWeekPlans(prev => new Map(prev).set(toWeek, copiedDays))
  }

  const saveProgram = async () => {
    setSaving(true)
    try {
      let progId = savedProgramId

      // Create program if new
      if (!progId) {
        const res = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: programName,
            client,
            totalWeeks,
            password,
            description,
          }),
        })
        const data = await res.json()
        progId = data.id
        setSavedProgramId(progId)
      }

      // Delete existing entries
      await fetch(`/api/programs/${progId}/entries`, { method: 'DELETE' })

      // Build all entries from all weeks
      const allEntries: any[] = []
      weekPlans.forEach((days, week) => {
        days.forEach((day) => {
          day.entries.forEach((entry, idx) => {
            allEntries.push({
              exerciseId: entry.exerciseId,
              entryName: entry.exerciseName,
              week,
              day: day.day,
              order: idx + 1,
              sets: entry.sets,
              reps: entry.reps,
              restSec: entry.restSec,
              supersetGroup: entry.supersetGroup || undefined,
              weightLoad: entry.weightLoad || undefined,
              notes: entry.notes || undefined,
            })
          })
        })
      })

      // Save entries in batches
      const BATCH_SIZE = 20
      for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
        const batch = allEntries.slice(i, i + BATCH_SIZE)
        await fetch(`/api/programs/${progId}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: batch }),
        })
      }

      alert(`Program saved! ${allEntries.length} exercises across ${weekPlans.size} weeks.`)
    } catch (err) {
      alert('Error saving program. Check console.')
      console.error(err)
    }
    setSaving(false)
  }

  if (loadingExercises || loadingProgram) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--brand-muted)' }}>Loading workout builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: isMobile ? '10px 12px' : '12px 20px',
        borderBottom: '1px solid var(--brand-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        background: 'var(--brand-card)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', minWidth: 0, flex: 1 }}>
          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '13px', flexShrink: 0 }} onClick={() => router.push('/admin')}>
            ←
          </button>
          <h2 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {programName || 'New Program'}
            {client && !isMobile && <span style={{ color: 'var(--brand-green)', fontWeight: 400, marginLeft: '8px' }}>— {client}</span>}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button className="btn-secondary" style={{ padding: isMobile ? '8px 10px' : '8px 14px', fontSize: '13px' }} onClick={() => setShowSettings(true)}>
            {isMobile ? '⚙️' : 'Settings'}
          </button>
          <button
            className="btn-primary"
            style={{ padding: isMobile ? '8px 12px' : '8px 18px', fontSize: '13px' }}
            onClick={saveProgram}
            disabled={saving || !programName || !client || !password}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ProgramSettings
          programName={programName}
          setProgramName={setProgramName}
          client={client}
          setClient={setClient}
          clients={clients}
          totalWeeks={totalWeeks}
          setTotalWeeks={setTotalWeeks}
          password={password}
          setPassword={setPassword}
          description={description}
          setDescription={setDescription}
          onClose={() => setShowSettings(false)}
          isNew={!savedProgramId}
        />
      )}

      {/* Main content: Exercise Library + Week Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
        {/* Exercise Library — sidebar on desktop, bottom-sheet modal on mobile */}
        {!isMobile && (
          <div style={{
            width: '320px',
            minWidth: '320px',
            borderRight: '1px solid var(--brand-border)',
            overflow: 'auto',
            padding: '16px',
          }}>
            <ExerciseLibrary exercises={exercises} onAddToDay={addExerciseToDay} days={DAYS} />
          </div>
        )}

        {isMobile && mobileLibraryOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--brand-dark)',
            zIndex: 80,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--brand-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--brand-card)',
            }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Exercise Library</h3>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setMobileLibraryOpen(false)}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <ExerciseLibrary
                exercises={exercises}
                onAddToDay={(ex, dayIdx) => { addExerciseToDay(ex, dayIdx); setMobileLibraryOpen(false) }}
                days={DAYS}
              />
            </div>
          </div>
        )}

        {/* Right: Week/Day Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '12px' : '16px', paddingBottom: isMobile ? '80px' : '16px' }}>
          {/* Week tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
              <button
                key={w}
                onClick={() => setCurrentWeek(w)}
                style={{
                  padding: isMobile ? '10px 14px' : '8px 16px',
                  borderRadius: '8px',
                  border: currentWeek === w ? '1px solid var(--brand-green)' : '1px solid var(--brand-border)',
                  background: currentWeek === w ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
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

          {/* Copy-from-week controls */}
          {totalWeeks > 1 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              padding: '10px 12px',
              background: 'var(--brand-card)',
              border: '1px solid var(--brand-border)',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--brand-muted)' }}>
                Copy into Week {currentWeek} from:
              </span>
              <select
                className="input-field"
                value={copyFromWeek}
                onChange={e => setCopyFromWeek(e.target.value ? parseInt(e.target.value) : '')}
                style={{ padding: '6px 30px 6px 10px', fontSize: '13px', width: 'auto', minWidth: '120px' }}
              >
                <option value="">Select week...</option>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1)
                  .filter(w => w !== currentWeek)
                  .map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
              </select>
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
                disabled={copyFromWeek === ''}
                onClick={() => {
                  if (copyFromWeek !== '') {
                    copyWeek(copyFromWeek, currentWeek)
                    setCopyFromWeek('')
                  }
                }}
              >
                Copy
              </button>
            </div>
          )}

          <WeekDayGrid
            days={getCurrentDays()}
            onUpdateDays={updateDays}
            onRemoveEntry={removeEntry}
            onUpdateEntry={updateEntry}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Mobile: floating "Add Exercise" button */}
      {isMobile && !mobileLibraryOpen && (
        <button
          className="btn-primary"
          onClick={() => setMobileLibraryOpen(true)}
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            padding: '14px 20px',
            fontSize: '14px',
            borderRadius: '999px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            zIndex: 60,
          }}
        >
          + Add Exercise
        </button>
      )}
    </div>
  )
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <BuilderContent />
    </Suspense>
  )
}
