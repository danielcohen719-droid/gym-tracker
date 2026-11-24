import { useLiveQuery } from 'dexie-react-hooks'
import { getDoneSessions } from '../db'
import { Icon } from '../components/Icon'
import { duration, monthName, num, shortDate } from '../lib/format'
import { go } from '../lib/router'
import { sessionSetCount, sessionVolume } from '../lib/stats'

export default function History() {
  const sessions = useLiveQuery(getDoneSessions, [])
  if (!sessions) return <div className="loading" />

  const groups: { month: string; items: typeof sessions }[] = []
  for (const s of sessions) {
    const m = monthName(s.startedAt)
    if (groups[groups.length - 1]?.month !== m) groups.push({ month: m, items: [] })
    groups[groups.length - 1].items.push(s)
  }

  return (
    <div>
      <h1 className="page-title">היסטוריה</h1>
      {!sessions.length && (
        <div className="empty">
          <Icon name="history" size={40} />
          <p>עוד אין אימונים שהושלמו.</p>
        </div>
      )}
      {groups.map((g) => (
        <section key={g.month}>
          <div className="section-title">
            {g.month} · {g.items.length} אימונים
          </div>
          <div className="list">
            {g.items.map((s) => (
              <button className="row" key={s.id} onClick={() => go(`/history/${s.id}`)}>
                <span className="badge">{s.templateName}</span>
                <div className="row-main">
                  <div className="row-title">{shortDate(s.startedAt)}</div>
                  <div className="row-sub">
                    {s.finishedAt ? duration(s.finishedAt - s.startedAt) : ''} · {sessionSetCount(s)} סטים ·{' '}
                    {num(sessionVolume(s))} ק״ג
                  </div>
                </div>
                <Icon name="chev-left" className="muted" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
