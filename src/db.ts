import Dexie, { type EntityTable } from 'dexie'
import { SEED_EXERCISES, SEED_TEMPLATES } from './seed'

export type Equipment = 'machine' | 'cable' | 'barbell' | 'dumbbell' | 'bodyweight'

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  machine: 'מכונה',
  cable: 'כבל',
  barbell: 'מוט',
  dumbbell: 'משקולות יד',
  bodyweight: 'משקל גוף',
}

export const DEFAULT_INCREMENT: Record<Equipment, number> = {
  machine: 2.5,
  cable: 2.5,
  barbell: 2.5,
  dumbbell: 2,
  bodyweight: 2.5,
}

/** An exercise in the library (shared by all workouts). */
export interface Exercise {
  id: string
  name: string
  equipment: Equipment
  /** kg to add when double progression says "go up" */
  increment: number
  /** short Hebrew technique cues */
  cues: string[]
  /** permanent note, always shown (e.g. knee pain range) */
  note?: string
  /** image paths relative to the app base; 2 frames are animated */
  images?: string[]
}

/** One exercise slot inside a workout template. */
export interface TemplateExercise {
  key: string
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  /** rest in seconds */
  rest: number
}

/** A workout in the plan (A, B, ...). Rotation follows `order`. */
export interface Template {
  id: string
  name: string
  subtitle: string
  order: number
  exercises: TemplateExercise[]
}

export interface SetLog {
  weight: number | null
  reps: number | null
  done: boolean
  doneAt?: number
  /** user edited this set manually during the workout */
  touched?: boolean
}

export interface SessionExercise {
  key: string
  exerciseId: string
  name: string
  equipment: Equipment
  targetSets: number
  repMin: number
  repMax: number
  rest: number
  increment: number
  skipped: boolean
  note: string
  sets: SetLog[]
  /** snapshot of the previous time this exercise was done */
  prev?: { date: number; sets: { weight: number | null; reps: number | null }[] }
  /** double-progression suggestion */
  suggestion?: { weight: number; state: 'open' | 'applied' | 'dismissed' }
}

export interface RestState {
  endsAt: number
  duration: number
  label: string
}

/** A performed workout (active or finished). */
export interface Session {
  id: string
  templateId: string
  templateName: string
  status: 'active' | 'done'
  startedAt: number
  finishedAt?: number
  current: number
  exercises: SessionExercise[]
  rest?: RestState | null
}

export interface Setting {
  key: string
  value: unknown
}

class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  templates!: EntityTable<Template, 'id'>
  sessions!: EntityTable<Session, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('gym-tracker')
    this.version(1).stores({
      exercises: 'id, name',
      templates: 'id, order',
      sessions: 'id, status, startedAt, templateId',
      settings: 'key',
    })
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(SEED_EXERCISES)
      tx.table('templates').bulkAdd(SEED_TEMPLATES)
    })
  }
}

export const db = new GymDB()

export async function getActiveSession(): Promise<Session | null> {
  return (await db.sessions.where('status').equals('active').first()) ?? null
}

/** Finished sessions, newest first. */
export async function getDoneSessions(): Promise<Session[]> {
  const all = await db.sessions.where('status').equals('done').toArray()
  return all.sort((a, b) => b.startedAt - a.startedAt)
}
