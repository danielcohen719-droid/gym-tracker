import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export const SETTINGS_DEFAULTS = {
  sound: true,
  vibration: true,
  keepAwake: true,
  lastBackupAt: 0,
  backupSnoozeUntil: 0,
}

export type Settings = typeof SETTINGS_DEFAULTS

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const s: Settings = { ...SETTINGS_DEFAULTS }
  for (const r of rows) if (r.key in s) (s as Record<string, unknown>)[r.key] = r.value
  return s
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(loadSettings, [])
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  return db.settings.put({ key, value })
}
