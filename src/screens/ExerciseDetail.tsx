import { useLiveQuery } from 'dexie-react-hooks'
import { db, getDoneSessions } from '../db'
import { ExerciseImage } from '../components/ExerciseImage'
import { Icon } from '../components/Icon'
import { LineChart } from '../components/LineChart'
import { SetsText } from '../components/SetsText'
import { TopBar } from '../components/TopBar'
import { kg, shortDate } from '../lib/format'
import { go } from '../lib/router'
import { exerciseHistory } from '../lib/stats'

export default function ExerciseDetail({ id }: { id: string }) {
  const data = useLiveQuery(async () => {
    const ex = await db.exercises.get(id)
    if (!ex) return null
    return { ex, sessions: await getDoneSessions() }
  }, [id])

  if (data === undefined) return <div className="loading" />
  if (data === null)
    return (
      <>
        <TopBar title="תרגיל" backTo="/progress" />
        <p className="muted">התרגיל לא נמצא.</p>
      </>
    )
  const { ex, sessions } = data
  const h = exerciseHistory(id, sessions)
  const bw = ex.equipment === 'bodyweight'
  const hasWeight = h.some((p) => p.maxWeight > 0)

  let prW = h[0]
  let prE = h[0]
  for (const p of h) {
    if (p.maxWeight >= (prW?.maxWeight ?? 0)) prW = p
    if (p.bestE1rm >= (prE?.bestE1rm ?? 0)) prE = p
  }
  const maxReps = h.reduce((m, p) => Math.max(m, p.maxReps), 0)

  return (
    <div className="stack">
      <TopBar
        title={<bdi>{ex.name}</bdi>}
        backTo="/progress"
        actions={
          <button className="icon-btn" onClick={() => go(`/exercise/${id}/edit`)} aria-label="ערוך תרגיל">
            <Icon name="edit" />
          </button>
        }
      />

      <div className="tiles three">
        <div className="tile">
          <div className="tile-label">{hasWeight ? 'שיא משקל' : 'שיא חזרות'}</div>
          <div className="tile-value">
            {hasWeight ? (
              <>
                {kg(prW?.maxWeight)} <span className="tile-unit">ק״ג</span>
              </>
            ) : (
              maxReps || '—'
            )}
          </div>
          {hasWeight && prW && <div className="tile-sub">{shortDate(prW.date)}</div>}
        </div>
        <div className="tile">
          <div className="tile-label">1RM משוער</div>
          <div className="tile-value">
            {prE && prE.bestE1rm > 0 ? (
              <>
                {kg(Math.round(prE.bestE1rm * 10) / 10)} <span className="tile-unit">ק״ג</span>
              </>
            ) : (
              '—'
            )}
          </div>
          {prE && prE.bestE1rm > 0 && <div className="tile-sub">Epley</div>}
        </div>
        <div className="tile">
          <div className="tile-label">אימונים</div>
          <div className="tile-value">{h.length}</div>
        </div>
      </div>

      <section className="card">
        <div className="card-title">התקדמות לאורך זמן</div>
        {h.length === 0 ? (
          <p className="muted small">הגרף יופיע אחרי האימון הראשון בתרגיל.</p>
        ) : hasWeight ? (
          <>
            <LineChart
              dates={h.map((p) => p.date)}
              series={[
                { label: 'משקל מקסימלי', color: 'var(--c-weight)', values: h.map((p) => p.maxWeight) },
                { label: '1RM משוער', color: 'var(--c-e1rm)', values: h.map((p) => p.bestE1rm) },
              ]}
            />
            <div className="legend">
              <span>
                <i style={{ background: 'var(--c-weight)' }} />
                משקל מקסימלי
              </span>
              <span>
                <i style={{ background: 'var(--c-e1rm)' }} />
                1RM משוער (Epley)
              </span>
            </div>
          </>
        ) : (
          <LineChart
            dates={h.map((p) => p.date)}
            unit="חזרות"
            series={[{ label: 'חזרות מקסימום', color: 'var(--c-e1rm)', values: h.map((p) => p.maxReps) }]}
          />
        )}
      </section>

      {h.length > 0 && (
        <section>
          <div className="section-title">אימונים אחרונים</div>
          <div className="list">
            {[...h]
              .reverse()
              .slice(0, 15)
              .map((p) => (
                <button className="row" key={p.sessionId} onClick={() => go(`/history/${p.sessionId}`)}>
                  <div className="row-main">
                    <div className="row-title">{shortDate(p.date)}</div>
                    <div className="row-sub num">
                      <SetsText sets={p.sets} bodyweight={bw} />
                    </div>
                  </div>
                  <Icon name="chev-left" className="muted" />
                </button>
              ))}
          </div>
        </section>
      )}

      <section className="card">
        <ExerciseImage ex={ex} />
        {!!ex.cues.length && (
          <ul className="cues">
            {ex.cues.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        {ex.note && (
          <div className="callout warn">
            <Icon name="alert" size={20} />
            <span>{ex.note}</span>
          </div>
        )}
      </section>
    </div>
  )
}
