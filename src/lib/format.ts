const DAY = 24 * 60 * 60 * 1000

export const round2 = (n: number) => Math.round(n * 100) / 100

/** 22.5 -> "22.5", 20 -> "20" */
export const kg = (n: number | null | undefined) => (n == null ? '–' : String(round2(n)))

export const num = (n: number) => Math.round(n).toLocaleString('he-IL')

/** seconds -> "2:30" */
export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** elapsed ms -> "47:05" or "1:12:05" */
export function stopwatch(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** ms -> "58 דק׳" / "1:05 שע׳" */
export function duration(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60000))
  if (m < 60) return `${m} דק׳`
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} שע׳`
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Week starts on Sunday (Israel). */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts))
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

const shortFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })
const longFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit' })

export const shortDate = (ts: number) => shortFmt.format(ts)
export const longDate = (ts: number) => longFmt.format(ts)
export const monthName = (ts: number) => monthFmt.format(ts)
export const timeOfDay = (ts: number) => timeFmt.format(ts)
export const dm = (ts: number) => {
  const d = new Date(ts)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

/** "היום" / "אתמול" / "לפני 3 ימים" / "יום ג׳, 18.11" */
export function relDay(ts: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(ts)) / DAY)
  if (diff <= 0) return 'היום'
  if (diff === 1) return 'אתמול'
  if (diff === 2) return 'שלשום'
  if (diff < 7) return `לפני ${diff} ימים`
  return shortDate(ts)
}

export function daysSince(ts: number, now = Date.now()): number {
  return Math.floor((now - ts) / DAY)
}
