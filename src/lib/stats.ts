import type { Session, SessionExercise, SetLog } from '../db'
import { round2 } from './format'

/** Epley estimated 1-rep max */
export const e1rm = (w: number, r: number) => (r <= 1 ? w : w * (1 + r / 30))

export const doneSets = (se: SessionExercise): SetLog[] => se.sets.filter((s) => s.done && (s.reps ?? 0) > 0)

export function sessionVolume(s: Session): number {
  let v = 0
  for (const e of s.exercises) for (const set of doneSets(e)) v += (set.weight ?? 0) * (set.reps ?? 0)
  return v
}

export function sessionSetCount(s: Session): number {
  return s.exercises.reduce((n, e) => n + doneSets(e).length, 0)
}

export interface Best {
  maxWeight: number
  bestE1rm: number
  maxReps: number
}

export function bestOf(sets: SetLog[]): Best | null {
  const valid = sets.filter((s) => s.done && (s.reps ?? 0) > 0)
  if (!valid.length) return null
  let maxWeight = 0
  let bestE1rm = 0
  let maxReps = 0
  for (const s of valid) {
    const w = s.weight ?? 0
    const r = s.reps ?? 0
    maxWeight = Math.max(maxWeight, w)
    if (w > 0) bestE1rm = Math.max(bestE1rm, e1rm(w, r))
    maxReps = Math.max(maxReps, r)
  }
  return { maxWeight, bestE1rm, maxReps }
}

function mergeBest(a: Best | null, b: Best | null): Best | null {
  if (!a) return b
  if (!b) return a
  return {
    maxWeight: Math.max(a.maxWeight, b.maxWeight),
    bestE1rm: Math.max(a.bestE1rm, b.bestE1rm),
    maxReps: Math.max(a.maxReps, b.maxReps),
  }
}

export interface PR {
  exerciseId: string
  name: string
  kind: 'weight' | 'e1rm' | 'reps'
  value: number
  prev: number
}

/** New personal records in `s` compared with all earlier finished sessions. */
export function findPRs(s: Session, all: Session[]): PR[] {
  const earlier = all.filter((x) => x.id !== s.id && x.status === 'done' && x.startedAt < s.startedAt)
  const out: PR[] = []
  for (const e of s.exercises) {
    const cur = bestOf(e.sets)
    if (!cur) continue
    let prev: Best | null = null
    for (const p of earlier) for (const pe of p.exercises) if (pe.exerciseId === e.exerciseId) prev = mergeBest(prev, bestOf(pe.sets))
    if (!prev) continue // first time doing it – that's a baseline, not a record
    const base = { exerciseId: e.exerciseId, name: e.name }
    if (cur.maxWeight > 0 && cur.maxWeight > prev.maxWeight) {
      out.push({ ...base, kind: 'weight', value: cur.maxWeight, prev: prev.maxWeight })
    } else if (cur.bestE1rm > 0 && cur.bestE1rm > prev.bestE1rm + 0.05) {
      out.push({ ...base, kind: 'e1rm', value: round2(cur.bestE1rm), prev: round2(prev.bestE1rm) })
    } else if (cur.maxWeight === 0 && prev.maxWeight === 0 && cur.maxReps > prev.maxReps) {
      out.push({ ...base, kind: 'reps', value: cur.maxReps, prev: prev.maxReps })
    }
  }
  return out
}

export interface HistoryPoint {
  sessionId: string
  date: number
  maxWeight: number
  bestE1rm: number
  maxReps: number
  sets: SetLog[]
}

/** One point per finished session that included the exercise, oldest first. */
export function exerciseHistory(exerciseId: string, sessions: Session[]): HistoryPoint[] {
  const pts: HistoryPoint[] = []
  for (const s of sessions) {
    if (s.status !== 'done') continue
    const sets = s.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => doneSets(e))
    const b = bestOf(sets)
    if (!b) continue
    pts.push({ sessionId: s.id, date: s.startedAt, ...b, bestE1rm: round2(b.bestE1rm), sets })
  }
  return pts.sort((a, b) => a.date - b.date)
}
