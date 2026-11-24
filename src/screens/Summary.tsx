import { useLiveQuery } from 'dexie-react-hooks'
import { db, getDoneSessions } from '../db'
import { Icon } from '../components/Icon'
import { PRList, SessionTiles } from '../components/SessionView'
import { longDate } from '../lib/format'
import { go } from '../lib/router'
import { findPRs, sessionVolume } from '../lib/stats'

export default function Summary({ id }: { id: string }) {
  const data = useLiveQuery(async () => {
    const s = await db.sessions.get(id)
    if (!s) return null
    return { s, all: await getDoneSessions() }
  }, [id])

  if (data === undefined) return <div className="loading" />
  if (data === null)
    return (
      <div className="stack">
        <p>האימון לא נמצא.</p>
        <button className="btn btn-primary btn-block" onClick={() => go('/', { root: true })}>
          למסך הבית
        </button>
      </div>
    )

  const { s, all } = data
  const prs = findPRs(s, all)
  const prevSame = all.find((x) => x.templateId === s.templateId && x.startedAt < s.startedAt)
  const vol = sessionVolume(s)
  const prevVol = prevSame ? sessionVolume(prevSame) : 0
  const delta = prevVol > 0 ? Math.round(((vol - prevVol) / prevVol) * 100) : null

  return (
    <div className="stack summary">
      <div className="summary-hero">
        <div className="big-check">
          <Icon name="check" size={40} stroke={3} />
        </div>
        <h1 className="page-title">כל הכבוד!</h1>
        <div className="muted">
          אימון {s.templateName} · {longDate(s.startedAt)}
        </div>
      </div>

      <SessionTiles s={s} />

      {delta !== null && (
        <div className={`callout ${delta >= 0 ? 'accent' : 'note'}`}>
          <Icon name={delta >= 0 ? 'up' : 'down'} size={20} />
          <span>
            נפח {delta >= 0 ? 'גבוה' : 'נמוך'} ב-{Math.abs(delta)}% מאימון {s.templateName} הקודם
          </span>
        </div>
      )}

      {prs.length ? (
        <PRList prs={prs} />
      ) : (
        <div className="card soft muted small">אין שיאים חדשים הפעם – העקביות היא מה שבונה אותם.</div>
      )}

      <button className="btn btn-primary btn-xl" onClick={() => go('/', { root: true })}>
        חזרה למסך הבית
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => go(`/history/${s.id}`, { root: true })}>
        פירוט האימון
      </button>
    </div>
  )
}
