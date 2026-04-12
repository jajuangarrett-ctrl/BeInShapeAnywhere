import { NextResponse } from 'next/server'
import { getExercises, createExercise } from '@/lib/notion'

const EXERCISES_TO_SEED = [
  // Lower Body
  {
    name: 'Goblet Squat',
    muscleGroup: ['Quads', 'Glutes'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'Great for keeping the chest upright and improving hip mobility.',
  },
  {
    name: 'Stiff-Legged Deadlift',
    muscleGroup: ['Hamstrings', 'Glutes'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'Focuses on the hamstrings and your posterior chain.',
  },
  {
    name: 'Alternating Reverse Lunges',
    muscleGroup: ['Quads', 'Glutes'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'Targets the quads and glutes with a focus on stability.',
  },
  {
    name: 'Sumo Squat',
    muscleGroup: ['Glutes', 'Inner Thighs'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'A wider stance that hits the inner thighs and glutes.',
  },
  {
    name: 'Walking Lunges',
    muscleGroup: ['Quads', 'Glutes'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'A functional movement that builds power and balance.',
  },
  {
    name: 'Lateral Lunges',
    muscleGroup: ['Glutes'],
    exerciseCategory: ['Lower Body'],
    equipment: ['Dumbbell'],
    instructions: 'Targets the side of the glutes and improves lateral mobility.',
  },
  // Upper Body (Push & Pull)
  {
    name: 'Chest Floor Press',
    muscleGroup: ['Chest'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'A solid alternative if you aren\'t using a bench.',
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroup: ['Chest'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'Targets the upper chest.',
  },
  {
    name: 'Dumbbell Flys',
    muscleGroup: ['Chest'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'Great for chest isolation and stretching.',
  },
  {
    name: 'Bent-Over Rows',
    muscleGroup: ['Back'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'A fundamental move for building a strong back.',
  },
  {
    name: 'Hex Press',
    muscleGroup: ['Chest'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'Pressing the dumbbells together throughout the movement to maximize chest contraction.',
  },
  {
    name: 'Dumbbell Shrugs',
    muscleGroup: ['Traps'],
    exerciseCategory: ['Upper Body'],
    equipment: ['Dumbbell'],
    instructions: 'Specifically targets the traps.',
  },
  // Shoulders & Arms
  {
    name: 'Alternating Front Raise',
    muscleGroup: ['Shoulders'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'Isolates the anterior deltoids.',
  },
  {
    name: 'Single-Arm Tate Press',
    muscleGroup: ['Triceps'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'An excellent isolation move for the triceps.',
  },
  {
    name: 'Incline Dumbbell Curls',
    muscleGroup: ['Biceps'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'Provides a deep stretch for the biceps.',
  },
  {
    name: 'Lateral Raises',
    muscleGroup: ['Shoulders'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'The go-to move for building shoulder width.',
  },
  {
    name: 'Arnold Press',
    muscleGroup: ['Shoulders'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'A rotating shoulder press that hits all three heads of the deltoid.',
  },
  // Full Body & Functional
  {
    name: 'Dumbbell Deadlift',
    muscleGroup: ['Full Body', 'Hamstrings', 'Back'],
    exerciseCategory: ['Full Body & Functional'],
    equipment: ['Dumbbell'],
    instructions: 'The standard heavy hitter for overall strength.',
  },
  {
    name: 'Single-Leg Deadlift',
    muscleGroup: ['Hamstrings', 'Glutes'],
    exerciseCategory: ['Full Body & Functional'],
    equipment: ['Dumbbell'],
    instructions: 'Challenges your balance while hammering the hamstrings.',
  },
  {
    name: 'Squat-to-Overhead Press',
    muscleGroup: ['Full Body', 'Shoulders', 'Quads'],
    exerciseCategory: ['Full Body & Functional'],
    equipment: ['Dumbbell'],
    instructions: 'A compound movement that gets the heart rate up and works the entire body.',
  },
  {
    name: 'Bicep Curls w/ DB',
    muscleGroup: ['Biceps'],
    exerciseCategory: ['Shoulders & Arms'],
    equipment: ['Dumbbell'],
    instructions: 'Standard dumbbell bicep curls for arm development.',
  },
]

export async function POST() {
  try {
    // Fetch existing exercises to avoid duplicates
    const existing = await getExercises()
    const existingNames = new Set(existing.map(e => e.name.toLowerCase().trim()))

    const created: string[] = []
    const skipped: string[] = []

    for (const exercise of EXERCISES_TO_SEED) {
      if (existingNames.has(exercise.name.toLowerCase().trim())) {
        skipped.push(exercise.name)
        continue
      }
      const id = await createExercise({
        ...exercise,
        published: true,
      })
      created.push(exercise.name)
      // Avoid rate limiting
      await new Promise(r => setTimeout(r, 350))
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      createdExercises: created,
      skippedExercises: skipped,
    })
  } catch (error: any) {
    console.error('Error seeding exercises:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
