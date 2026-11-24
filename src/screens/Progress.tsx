import { useLiveQuery } from 'dexie-react-hooks'
import { db, getDoneSessions, type Exercise } from '../db'
import { ExerciseImage } from '../components/ExerciseImage'
import { Icon } from '../components/Icon'
import { kg, relDay } from '../lib/format'
import { go } from '../lib/router'
import { exerciseHistory } from '../lib/stats'

export default function Progress() {
  const data = useLiveQuery(async () => {
    const [exercises, templates, sessions] = await Promise.all([
      db.exercises.toArray(),
      db.templates.orderBy('order').toArray(),
      getDoneSessions(),
    ])
    return { exercises, templates, sessions }
  }, [])
  if (!data) return <div className="loading" />
  const { exercises, templates, sessions } = data
  const byId = new Map(exercises.map((e) => [e.id, e]))

  // Group by workout in plan order; exercises that only exist in history go to "other".
  const seen = new Set<string>()
  const groups: { title: string; items: Exercise[] }[] = []
  for (const t of templates) {
    const items: Exercise[] = []
    for (const te of t.exercises) {
      const ex = byId.get(te.exerciseId)
      if (ex && !seen.has(ex.id)) {
        seen.add(ex.id)
        items.push(ex)
      }
    }
    if (items.length) groups.push({ title: `אימון ${t.name}`, items })
  }
  const other = exercises.filter(
    (e) => !seen.has(e.id) && sessions.some((s) => s.exercises.some((x) => x.exerciseId === e.id)),
  )
  if (other.length) groups.push({ title: 'תרגילים נוספים', items: other })

  return (
    <div>
      <h1 className="page-title">התקדמות</h1>
      {groups.map((g) => (
        <section key={g.title}>
          <div className="section-title">{g.title}</div>
          <div className="list">
            {g.items.map((ex) => {
              const h = exerciseHistory(ex.id, sessions)
              const best = h.reduce((m, p) => Math.max(m, p.maxWeight), 0)
              const last = h[h.length - 1]
              return (
                <button className="row" key={ex.id} onClick={() => go(`/exercise/${ex.id}`)}>
                  <ExerciseImage ex={ex} size="thumb" />
                  <div className="row-main">
                    <div className="row-title">
                      <bdi>{ex.name}</bdi>
                    </div>
                    <div className="row-sub">
                      {last
                        ? `${best > 0 ? `שיא ${kg(best)} ק״ג` : `שיא ${h.reduce((m, p) => Math.max(m, p.maxReps), 0)} חזרות`} · ${relDay(last.date)}`
                        : 'עוד אין נתונים'}
                    </div>
                  </div>
                  <Icon name="chev-left" className="muted" />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
