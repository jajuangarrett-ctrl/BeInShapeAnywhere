export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
export type DayOfWeek = typeof DAYS_OF_WEEK[number]

export const SUPERSET_GROUPS = ['A', 'B', 'C', 'D', 'E'] as const
export type SupersetGroup = typeof SUPERSET_GROUPS[number]

export const SUPERSET_COLORS: Record<string, string> = {
  A: '#4ADE80', // green
  B: '#60A5FA', // blue
  C: '#C084FC', // purple
  D: '#FB923C', // orange
  E: '#F87171', // red
}

// Shape of a workout entry in the builder (before saving to Notion)
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
  day: DayOfWeek
  entries: BuilderEntry[]
}

export interface WeekPlan {
  week: number
  days: DayWorkout[]
}
