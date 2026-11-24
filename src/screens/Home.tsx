import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getActiveSession, getDoneSessions } from '../db'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Feedback'
import { exportBackup } from '../lib/backup'
import { daysSince, relDay, shortDate, startOfWeek, stopwatch } from '../lib/format'
import { isIOS, isStandalone, useNow } from '../lib/hooks'
import { go } from '../lib/router'
import { setSetting, useSettings } from '../lib/settings'
import { sessionSetCount } from '../lib/stats'
import { nextTemplate, startWorkout } from '../lib/workout'

const MONTH = 30 * 24 * 3600 * 1000
const WEEK_TARGET = 4

export default function Home() {
  const data = useLiveQuery(async () => {
    const [templates, active, done] = await Promise.all([
      db.templates.orderBy('order').toArray(),
      getActiveSession(),
      getDoneSessions(),
    ])
    return { templates, active, done }
  }, [])
  const settings = useSettings()
  const toast = useToast()
  const now = useNow(30000)
  const [picked, setPicked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hideInstall, setHideInstall] = useState(() => {
    try {
      return localStorage.getItem('hideInstallHint') === '1'
    } catch {
      return false
    }
  })

  if (!data || !settings) return <div className="loading" />
  const { templates, active, done } = data
  const last = done[0]
  const next = nextTemplate(templates, last)
  const chosen = templates.find((t) => t.id === picked) ?? next
  const weekCount = done.filter((s) => s.startedAt >= startOfWeek(now)).length

  // Gentle monthly backup reminder
  const firstAt = done.length ? done[done.length - 1].startedAt : 0
  const since = settings.lastBackupAt || firstAt
  const backupDue = done.length > 0 && now - since > MONTH && now > settings.backupSnoozeUntil
  const showInstall = !hideInstall && isIOS() && !isStandalone()

  const start = async () => {
    if (!chosen || busy) return
    setBusy(true)
    try {
      await startWorkout(chosen.id)
      go('/workout')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <header className="home-head">
        <div>
          <div className="muted small">{shortDate(now)}</div>
          <h1 className="page-title">יומן אימונים</h1>
        </div>
      </header>

      {active ? (
        <section className="card hero">
          <div className="hero-label">אימון בתהליך</div>
          <div className="hero-row">
            <div className="hero-letter">{active.templateName}</div>
            <div className="hero-info">
              <div className="hero-sub">התחיל לפני {stopwatch(now - active.startedAt)}</div>
              <div className="hero-sub">
                {sessionSetCount(active)} / {active.exercises.reduce((n, e) => n + (e.skipped ? 0 : e.sets.length), 0)} סטים
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-xl" onClick={() => go('/workout')}>
            <Icon name="play" /> המשך אימון
          </button>
        </section>
      ) : chosen ? (
        <section className="card hero">
          <div className="hero-label">{chosen.id === next?.id ? 'האימון הבא' : 'נבחר ידנית'}</div>
          <div className="hero-row">
            <div className="hero-letter">{chosen.name}</div>
            <div className="hero-info">
              <div className="hero-sub">{chosen.subtitle}</div>
              <div className="hero-sub muted">{chosen.exercises.length} תרגילים</div>
            </div>
          </div>
          <button className="btn btn-primary btn-xl" onClick={start} disabled={busy || !chosen.exercises.length}>
            <Icon name="play" /> התחל אימון
          </button>
          {templates.length > 1 && (
            <div className="pick">
              <span className="muted small">בחירה ידנית:</span>
              <div className="chips">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    className={`chip ${t.id === chosen.id ? 'on' : ''}`}
                    onClick={() => setPicked(t.id)}
                    aria-pressed={t.id === chosen.id}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <p>אין אימונים בתוכנית.</p>
          <button className="btn btn-primary btn-block" onClick={() => go('/plan')}>
            לעריכת התוכנית
          </button>
        </section>
      )}

      <div className="tiles">
        <button className="tile" onClick={() => last && go(`/history/${last.id}`)}>
          <div className="tile-label">אימון אחרון</div>
          <div className="tile-value">{last ? relDay(last.startedAt, now) : '—'}</div>
          <div className="tile-sub">{last ? `אימון ${last.templateName} · ${shortDate(last.startedAt)}` : 'עוד לא התאמנת'}</div>
        </button>
        <div className="tile">
          <div className="tile-label">השבוע</div>
          <div className="tile-value">
            {weekCount} <span className="tile-unit">{weekCount === 1 ? 'אימון' : 'אימונים'}</span>
          </div>
          <div className="dots" aria-label={`${weekCount} מתוך ${WEEK_TARGET}`}>
            {Array.from({ length: Math.max(WEEK_TARGET, weekCount) }, (_, i) => (
              <span key={i} className={`dot ${i < weekCount ? 'on' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {backupDue && (
        <section className="card soft">
          <div className="soft-row">
            <Icon name="download" />
            <div>
              <b>זמן לגיבוי</b>
              <div className="muted small">
                {settings.lastBackupAt
                  ? `הגיבוי האחרון היה לפני ${daysSince(settings.lastBackupAt, now)} ימים.`
                  : 'עוד לא גיבית את הנתונים.'}{' '}
                הנתונים שמורים רק באייפון – כדאי לשמור עותק בקבצים.
              </div>
            </div>
          </div>
          <div className="row-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={async () => {
                const r = await exportBackup()
                if (r !== 'cancelled') toast('הגיבוי נשמר ✓')
              }}
            >
              גבה עכשיו
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSetting('backupSnoozeUntil', Date.now() + 7 * 86400000)}>
              אחר כך
            </button>
          </div>
        </section>
      )}

      {showInstall && (
        <section className="card soft">
          <div className="soft-row">
            <Icon name="share" />
            <div>
              <b>התקנה על מסך הבית</b>
              <div className="muted small">
                ב-Safari: לחץ על כפתור השיתוף ⬆️ ואז "הוסף למסך הבית". כך האפליקציה תיפתח במסך מלא ותעבוד בלי אינטרנט.
              </div>
            </div>
          </div>
          <div className="row-actions">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setHideInstall(true)
                try {
                  localStorage.setItem('hideInstallHint', '1')
                } catch {
                  /* ignore */
                }
              }}
            >
              הבנתי
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
