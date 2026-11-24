import { db, type Exercise, type Session, type Setting, type Template } from '../db'
import { setSetting } from './settings'

interface BackupFile {
  app: 'gym-tracker'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  templates: Template[]
  sessions: Session[]
  settings: Setting[]
}

const LOCAL_ONLY = new Set(['lastBackupAt', 'backupSnoozeUntil'])

async function build(): Promise<BackupFile> {
  const [exercises, templates, sessions, settings] = await Promise.all([
    db.exercises.toArray(),
    db.templates.toArray(),
    db.sessions.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'gym-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    templates,
    sessions,
    settings: settings.filter((s) => !LOCAL_ONLY.has(s.key)),
  }
}

/** Export everything as JSON: share sheet on iPhone ("Save to Files"), download elsewhere. */
export async function exportBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const data = await build()
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const name = `gym-backup-${stamp}.json`
  const json = JSON.stringify(data)
  const file = new File([json], name, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      await setSetting('lastBackupAt', Date.now())
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // fall through to a regular download
    }
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
  await setSetting('lastBackupAt', Date.now())
  return 'downloaded'
}

function validate(x: unknown): BackupFile {
  const o = x as Partial<BackupFile>
  if (!o || o.app !== 'gym-tracker') throw new Error('הקובץ הזה אינו גיבוי של יומן האימונים')
  if (!Array.isArray(o.exercises) || !Array.isArray(o.templates) || !Array.isArray(o.sessions))
    throw new Error('קובץ הגיבוי פגום')
  for (const s of o.sessions)
    if (!s || typeof s.id !== 'string' || !Array.isArray(s.exercises)) throw new Error('קובץ הגיבוי פגום')
  if (!o.templates.length) throw new Error('בגיבוי אין תוכנית אימונים')
  return { ...o, settings: Array.isArray(o.settings) ? o.settings : [] } as BackupFile
}

export async function readBackup(file: File): Promise<BackupFile> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('לא ניתן לקרוא את הקובץ (JSON לא תקין)')
  }
  return validate(parsed)
}

/** Replace all local data with the backup. */
export async function restoreBackup(data: BackupFile) {
  await db.transaction('rw', [db.exercises, db.templates, db.sessions, db.settings], async () => {
    await Promise.all([db.exercises.clear(), db.templates.clear(), db.sessions.clear(), db.settings.clear()])
    await db.exercises.bulkPut(data.exercises)
    await db.templates.bulkPut(data.templates)
    await db.sessions.bulkPut(data.sessions)
    await db.settings.bulkPut(data.settings.filter((s) => !LOCAL_ONLY.has(s.key)))
    await db.settings.put({ key: 'lastBackupAt', value: Date.now() })
  })
}
