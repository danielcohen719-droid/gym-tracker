import { db, getActiveSession, getDoneSessions, type Session, type SessionExercise, type SetLog, type Template } from '../db'
import { round2 } from './format'
import { uid } from './id'

/** Next workout in the rotation: the one after the last finished workout. */
export function nextTemplate(templates: Template[], lastDone?: Session | null): Template | undefined {
  if (!templates.length) return undefined
  if (!lastDone) return templates[0]
  const i = templates.findIndex((t) => t.id === lastDone.templateId)
  return i === -1 ? templates[0] : templates[(i + 1) % templates.length]
}

/** Create a new active session from a template, pre-filled from history. */
export async function startWorkout(templateId: string): Promise<void> {
  if (await getActiveSession()) return
  const tpl = await db.templates.get(templateId)
  if (!tpl) throw new Error('template not found')
  const exercises = await db.exercises.bulkGet(tpl.exercises.map((t) => t.exerciseId))
  const done = await getDoneSessions()

  const items: SessionExercise[] = tpl.exercises.map((te, i) => {
    const ex = exercises[i]
    let prevSets: SetLog[] = []
    let prevDate = 0
    for (const s of done) {
      const found = s.exercises.find((e) => e.exerciseId === te.exerciseId && e.sets.some((x) => x.done))
      if (found) {
        prevSets = found.sets.filter((x) => x.done)
        prevDate = s.startedAt
        break
      }
    }
    const sets: SetLog[] = Array.from({ length: te.sets }, (_, k) => {
      const p = prevSets[k] ?? prevSets[prevSets.length - 1]
      return { weight: p?.weight ?? null, reps: p?.reps ?? null, done: false }
    })
    const increment = ex?.increment ?? 2.5

    // Double progression: every target set hit the top of the rep range last time.
    let suggestion: SessionExercise['suggestion']
    if (prevSets.length >= te.sets && prevSets.every((x) => (x.reps ?? 0) >= te.repMax)) {
      const top = Math.max(...prevSets.map((x) => x.weight ?? 0))
      suggestion = { weight: round2(top + increment), state: 'open' }
    }

    return {
      key: uid(),
      exerciseId: te.exerciseId,
      name: ex?.name ?? 'תרגיל',
      equipment: ex?.equipment ?? 'machine',
      targetSets: te.sets,
      repMin: te.repMin,
      repMax: te.repMax,
      rest: te.rest,
      increment,
      skipped: false,
      note: '',
      sets,
      prev: prevSets.length
        ? { date: prevDate, sets: prevSets.map((x) => ({ weight: x.weight, reps: x.reps })) }
        : undefined,
      suggestion,
    }
  })

  await db.sessions.add({
    id: uid(),
    templateId: tpl.id,
    templateName: tpl.name,
    status: 'active',
    startedAt: Date.now(),
    current: 0,
    exercises: items,
    rest: null,
  })
}

export const isComplete = (se: SessionExercise) => se.skipped || (se.sets.length > 0 && se.sets.every((s) => s.done))

/** Index of the next exercise that still has work, searching forward then wrapping. -1 if none. */
export function findNext(s: Session, from: number): number {
  const n = s.exercises.length
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n
    if (!isComplete(s.exercises[i])) return i
  }
  return -1
}
