import { Client } from '@notionhq/client'

const notion = new (Client as any)({ auth: process.env.NOTION_SECRET })

// Types
export interface Exercise {
  id: string
  name: string
  videoUrl: string
  muscleGroup: string[]
  exerciseCategory: string[]
  exerciseType: string[]
  equipment: string[]
  sets: number | null
  reps: number | null
  restSec: number | null
  instructions: string
  notes: string
  durationMin: number | null
  published: boolean
}

export interface TrainingProgram {
  id: string
  name: string
  client: string
  startDate: string | null
  totalWeeks: number | null
  password: string
  published: boolean
  description: string
  coachingNotes: string
}

export interface WorkoutEntry {
  id: string
  entryName: string
  programId: string
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
  // Populated from exercise library
  exercise?: Exercise
}

// Helper to extract text from Notion rich text
function getRichText(prop: any): string {
  if (!prop || prop.type !== 'rich_text') return ''
  return prop.rich_text?.map((t: any) => t.plain_text).join('') || ''
}

function getTitle(prop: any): string {
  if (!prop || prop.type !== 'title') return ''
  return prop.title?.map((t: any) => t.plain_text).join('') || ''
}

function getSelect(prop: any): string {
  if (!prop || prop.type !== 'select') return ''
  return prop.select?.name || ''
}

function getMultiSelect(prop: any): string[] {
  if (!prop || prop.type !== 'multi_select') return []
  return prop.multi_select?.map((s: any) => s.name) || []
}

function getNumber(prop: any): number | null {
  if (!prop || prop.type !== 'number') return null
  return prop.number
}

function getCheckbox(prop: any): boolean {
  if (!prop || prop.type !== 'checkbox') return false
  return prop.checkbox || false
}

function getUrl(prop: any): string {
  if (!prop || prop.type !== 'url') return ''
  return prop.url || ''
}

function getDate(prop: any): string | null {
  if (!prop || prop.type !== 'date' || !prop.date) return null
  return prop.date.start || null
}

function getRelationIds(prop: any): string[] {
  if (!prop || prop.type !== 'relation') return []
  return prop.relation?.map((r: any) => r.id) || []
}

// Fetch all exercises from the Exercise Library
export async function getExercises(): Promise<Exercise[]> {
  const dbId = process.env.NOTION_EXERCISE_DB!
  const results: any[] = []
  let cursor: string | undefined

  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
    })
    results.push(...response.results)
    cursor = response.has_more ? response.next_cursor as string : undefined
  } while (cursor)

  return results.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: getTitle(p['Workout Name']),
      videoUrl: getUrl(p['Video URL']),
      muscleGroup: getMultiSelect(p['Muscle Group']),
      exerciseCategory: getMultiSelect(p['Exercise Category']),
      exerciseType: getMultiSelect(p['Exercise Type']),
      equipment: getMultiSelect(p['Equipment']),
      sets: getNumber(p['Sets']),
      reps: getNumber(p['Reps']),
      restSec: getNumber(p['Rest (sec)']),
      instructions: getRichText(p['Instructions']),
      notes: getRichText(p['Notes']),
      durationMin: getNumber(p['Duration (min)']),
      published: getCheckbox(p['Published']),
    }
  }).filter(e => e.name) // filter out blank rows
}

// Fetch all training programs
export async function getPrograms(): Promise<TrainingProgram[]> {
  const dbId = process.env.NOTION_PROGRAMS_DB!
  const response = await notion.databases.query({
    database_id: dbId,
    page_size: 100,
  })

  return response.results.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      name: getTitle(p['Program Name']),
      client: getSelect(p['Client']),
      startDate: getDate(p['Start Date']),
      totalWeeks: getNumber(p['Total Weeks']),
      password: getRichText(p['Password']),
      published: getCheckbox(p['Published']),
      description: getRichText(p['Description']),
      coachingNotes: getRichText(p['Coaching Notes']),
    }
  }).filter((prog: TrainingProgram) => prog.name)
}

// Fetch a single program by password
export async function getProgramByPassword(password: string): Promise<TrainingProgram | null> {
  const programs = await getPrograms()
  return programs.find(p => p.password === password && p.published) || null
}

// Fetch workout entries for a specific program
export async function getEntriesForProgram(programId: string): Promise<WorkoutEntry[]> {
  const dbId = process.env.NOTION_ENTRIES_DB!
  const results: any[] = []
  let cursor: string | undefined

  do {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Program',
        relation: { contains: programId },
      },
      start_cursor: cursor,
      page_size: 100,
    })
    results.push(...response.results)
    cursor = response.has_more ? response.next_cursor as string : undefined
  } while (cursor)

  return results.map((page: any) => {
    const p = page.properties
    return {
      id: page.id,
      entryName: getTitle(p['Entry Name']),
      programId: getRelationIds(p['Program'])[0] || '',
      exerciseId: getRelationIds(p['Exercise'])[0] || '',
      week: getNumber(p['Week']) || 1,
      day: getSelect(p['Day']),
      order: getNumber(p['Order']) || 0,
      sets: getNumber(p['Sets']),
      reps: getRichText(p['Reps']),
      restSec: getNumber(p['Rest (sec)']),
      supersetGroup: getSelect(p['Superset Group']) || null,
      weightLoad: getRichText(p['Weight / Load']),
      notes: getRichText(p['Notes']),
      completed: getCheckbox(p['Completed']),
    }
  })
}

// Fetch entries with exercise data populated
export async function getPopulatedEntries(programId: string): Promise<WorkoutEntry[]> {
  const [entries, exercises] = await Promise.all([
    getEntriesForProgram(programId),
    getExercises(),
  ])

  const exerciseMap = new Map(exercises.map(e => [e.id, e]))

  return entries.map(entry => ({
    ...entry,
    exercise: exerciseMap.get(entry.exerciseId),
  })).sort((a, b) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return a.order - b.order
  })
}

// Create a new training program
export async function createProgram(data: {
  name: string
  client: string
  totalWeeks: number
  password: string
  description: string
  startDate?: string
}): Promise<string> {
  const dbId = process.env.NOTION_PROGRAMS_DB!
  const properties: any = {
    'Program Name': { title: [{ text: { content: data.name } }] },
    'Client': { select: { name: data.client } },
    'Total Weeks': { number: data.totalWeeks },
    'Password': { rich_text: [{ text: { content: data.password } }] },
    'Published': { checkbox: false },
    'Description': { rich_text: [{ text: { content: data.description } }] },
  }
  if (data.startDate) {
    properties['Start Date'] = { date: { start: data.startDate } }
  }

  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties,
  })
  return page.id
}

// Create workout entries (batch)
export async function createWorkoutEntries(entries: {
  programId: string
  exerciseId: string
  entryName: string
  week: number
  day: string
  order: number
  sets: number
  reps: string
  restSec: number
  supersetGroup?: string
  weightLoad?: string
  notes?: string
}[]): Promise<string[]> {
  const dbId = process.env.NOTION_ENTRIES_DB!
  const ids: string[] = []

  for (const entry of entries) {
    const properties: any = {
      'Entry Name': { title: [{ text: { content: entry.entryName } }] },
      'Program': { relation: [{ id: entry.programId }] },
      'Exercise': { relation: [{ id: entry.exerciseId }] },
      'Week': { number: entry.week },
      'Day': { select: { name: entry.day } },
      'Order': { number: entry.order },
      'Sets': { number: entry.sets },
      'Reps': { rich_text: [{ text: { content: entry.reps } }] },
      'Rest (sec)': { number: entry.restSec },
    }
    if (entry.supersetGroup) {
      properties['Superset Group'] = { select: { name: entry.supersetGroup } }
    }
    if (entry.weightLoad) {
      properties['Weight / Load'] = { rich_text: [{ text: { content: entry.weightLoad } }] }
    }
    if (entry.notes) {
      properties['Notes'] = { rich_text: [{ text: { content: entry.notes } }] }
    }

    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties,
    })
    ids.push(page.id)
  }

  return ids
}

// Delete workout entries for a program (for rebuilding)
export async function deleteEntriesForProgram(programId: string): Promise<void> {
  const entries = await getEntriesForProgram(programId)
  for (const entry of entries) {
    await notion.pages.update({
      page_id: entry.id,
      archived: true,
    })
  }
}

// Update program published status
export async function updateProgramPublished(programId: string, published: boolean): Promise<void> {
  await notion.pages.update({
    page_id: programId,
    properties: {
      'Published': { checkbox: published },
    },
  })
}

// Create a new exercise in the Exercise Library
export async function createExercise(data: {
  name: string
  muscleGroup?: string[]
  exerciseCategory?: string[]
  equipment?: string[]
  instructions?: string
  published?: boolean
}): Promise<string> {
  const dbId = process.env.NOTION_EXERCISE_DB!
  const properties: any = {
    'Workout Name': { title: [{ text: { content: data.name } }] },
    'Published': { checkbox: data.published ?? true },
  }
  if (data.muscleGroup?.length) {
    properties['Muscle Group'] = { multi_select: data.muscleGroup.map(n => ({ name: n })) }
  }
  if (data.exerciseCategory?.length) {
    properties['Exercise Category'] = { multi_select: data.exerciseCategory.map(n => ({ name: n })) }
  }
  if (data.equipment?.length) {
    properties['Equipment'] = { multi_select: data.equipment.map(n => ({ name: n })) }
  }
  if (data.instructions) {
    properties['Instructions'] = { rich_text: [{ text: { content: data.instructions } }] }
  }
  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties,
  })
  return page.id
}

// Update a single workout entry (day, completed, etc.)
export async function updateEntry(entryId: string, updates: {
  day?: string
  completed?: boolean
}): Promise<void> {
  const properties: any = {}
  if (updates.day !== undefined) {
    properties['Day'] = { select: { name: updates.day } }
  }
  if (updates.completed !== undefined) {
    properties['Completed'] = { checkbox: updates.completed }
  }
  await notion.pages.update({
    page_id: entryId,
    properties,
  })
}

// Bulk move entries from one day to another for a given program/week
export async function moveEntriesDay(programId: string, week: number, fromDay: string, toDay: string): Promise<number> {
  const entries = await getEntriesForProgram(programId)
  const toMove = entries.filter(e => e.week === week && e.day === fromDay)
  for (const entry of toMove) {
    await updateEntry(entry.id, { day: toDay })
  }
  return toMove.length
}

// Get available clients (from the Exercise Library's Client select options)
export async function getClients(): Promise<string[]> {
  const dbId = process.env.NOTION_EXERCISE_DB!
  const db = await notion.databases.retrieve({ database_id: dbId })
  const clientProp = (db as any).properties?.Client
  if (clientProp?.type === 'select') {
    return clientProp.select.options.map((o: any) => o.name)
  }
  return []
}
