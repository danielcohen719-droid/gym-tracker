import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Template } from '../db'
import { Icon } from '../components/Icon'
import { uid } from '../lib/id'
import { go } from '../lib/router'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function Plan() {
  const templates = useLiveQuery(() => db.templates.orderBy('order').toArray(), [])
  if (!templates) return <div className="loading" />

  const reorder = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= templates.length) return
    const list = [...templates]
    ;[list[i], list[j]] = [list[j], list[i]]
    await db.templates.bulkPut(list.map((t, k) => ({ ...t, order: k })))
  }

  const add = async () => {
    const used = new Set(templates.map((t) => t.name))
    const name = [...LETTERS].find((l) => !used.has(l)) ?? String(templates.length + 1)
    const t: Template = { id: uid(), name, subtitle: '', order: templates.length, exercises: [] }
    await db.templates.add(t)
    go(`/plan/${t.id}`)
  }

  return (
    <div>
      <h1 className="page-title">תוכנית</h1>
      <p className="muted small">
        האימונים מתחלפים לפי הסדר כאן: אחרי האימון האחרון בא שוב הראשון. אפשר תמיד לבחור ידנית במסך הבית.
      </p>
      <div className="stack">
        {templates.map((t, i) => (
          <div className="card plan-card" key={t.id}>
            <button className="plan-main" onClick={() => go(`/plan/${t.id}`)}>
              <span className="badge big">{t.name}</span>
              <div className="row-main">
                <div className="row-title">אימון {t.name}</div>
                <div className="row-sub">{t.subtitle || 'ללא תיאור'}</div>
                <div className="row-sub muted">{t.exercises.length} תרגילים</div>
              </div>
              <Icon name="chev-left" className="muted" />
            </button>
            {templates.length > 1 && (
              <div className="plan-order">
                <button className="icon-btn" disabled={i === 0} onClick={() => reorder(i, -1)} aria-label="הזז למעלה">
                  <Icon name="up" />
                </button>
                <button
                  className="icon-btn"
                  disabled={i === templates.length - 1}
                  onClick={() => reorder(i, 1)}
                  aria-label="הזז למטה"
                >
                  <Icon name="down" />
                </button>
              </div>
            )}
          </div>
        ))}
        <button className="btn btn-block dashed" onClick={add}>
          <Icon name="plus" /> הוסף אימון
        </button>
      </div>
    </div>
  )
}
