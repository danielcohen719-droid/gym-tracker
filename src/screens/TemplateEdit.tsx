import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Exercise, type Template, type TemplateExercise } from '../db'
import { useConfirm, useToast } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { Stepper } from '../components/Stepper'
import { TopBar } from '../components/TopBar'
import { clock } from '../lib/format'
import { uid } from '../lib/id'
import { back, go } from '../lib/router'

export default function TemplateEdit({ id }: { id: string }) {
  const [tpl, setTpl] = useState<Template | null>()
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const templateCount = useLiveQuery(() => db.templates.count(), [])
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const confirm = useConfirm()
  const toast = useToast()

  useEffect(() => {
    void db.templates.get(id).then((t) => setTpl(t ?? null))
  }, [id])

  if (tpl === undefined || !exercises) return <div className="loading" />
  if (tpl === null)
    return (
      <>
        <TopBar title="אימון" backTo="/plan" />
        <p className="muted">האימון לא נמצא.</p>
      </>
    )

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const save = (next: Template) => {
    setTpl(next)
    void db.templates.put(next)
  }
  const setRow = (i: number, patch: Partial<TemplateExercise>) =>
    save({ ...tpl, exercises: tpl.exercises.map((r, k) => (k === i ? { ...r, ...patch } : r)) })
  const moveRow = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= tpl.exercises.length) return
    const list = [...tpl.exercises]
    ;[list[i], list[j]] = [list[j], list[i]]
    save({ ...tpl, exercises: list })
  }
  const removeRow = async (i: number) => {
    const name = byId.get(tpl.exercises[i].exerciseId)?.name ?? 'התרגיל'
    const ok = await confirm({
      title: 'להסיר את התרגיל מהאימון?',
      message: `${name} יוסר מאימון ${tpl.name}. ההיסטוריה שלו נשמרת.`,
      confirmText: 'הסר',
      danger: true,
    })
    if (ok) save({ ...tpl, exercises: tpl.exercises.filter((_, k) => k !== i) })
  }
  const addExercise = (ex: Exercise) => {
    save({
      ...tpl,
      exercises: [...tpl.exercises, { key: uid(), exerciseId: ex.id, sets: 3, repMin: 8, repMax: 12, rest: 90 }],
    })
    setAdding(false)
    setQuery('')
    toast(`${ex.name} נוסף`)
  }
  const createExercise = async () => {
    const name = query.trim()
    if (!name) return
    const ex: Exercise = { id: uid(), name, equipment: 'machine', increment: 2.5, cues: [] }
    await db.exercises.add(ex)
    addExercise(ex)
  }
  const removeTemplate = async () => {
    const ok = await confirm({
      title: `למחוק את אימון ${tpl.name}?`,
      message: 'האימון יוסר מהתוכנית. אימונים שכבר בוצעו נשארים בהיסטוריה.',
      confirmText: 'מחק אימון',
      danger: true,
    })
    if (!ok) return
    await db.templates.delete(tpl.id)
    const rest = await db.templates.orderBy('order').toArray()
    await db.templates.bulkPut(rest.map((t, k) => ({ ...t, order: k })))
    back('/plan')
  }

  const q = query.trim().toLowerCase()
  const matches = exercises
    .filter((e) => !q || e.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="stack">
      <TopBar title={`אימון ${tpl.name}`} backTo="/plan" />

      <div className="tpl-fields">
        <label className="field narrow">
          <span className="field-label">שם</span>
          <input className="input center" value={tpl.name} maxLength={3} onChange={(e) => save({ ...tpl, name: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">קבוצות שרירים</span>
          <input
            className="input"
            value={tpl.subtitle}
            placeholder="למשל: חזה · כתפיים · רגליים"
            onChange={(e) => save({ ...tpl, subtitle: e.target.value })}
          />
        </label>
      </div>

      <div className="section-title">תרגילים ({tpl.exercises.length})</div>
      {tpl.exercises.map((r, i) => {
        const ex = byId.get(r.exerciseId)
        return (
          <div className="card tpl-row" key={r.key}>
            <div className="tpl-row-head">
              <span className="tpl-num">{i + 1}</span>
              <button className="tpl-name" onClick={() => go(`/exercise/${r.exerciseId}/edit`)}>
                <bdi>{ex?.name ?? 'תרגיל שנמחק'}</bdi>
                <Icon name="edit" size={16} className="muted" />
              </button>
              <button className="icon-btn" disabled={i === 0} onClick={() => moveRow(i, -1)} aria-label="הזז למעלה">
                <Icon name="up" size={20} />
              </button>
              <button
                className="icon-btn"
                disabled={i === tpl.exercises.length - 1}
                onClick={() => moveRow(i, 1)}
                aria-label="הזז למטה"
              >
                <Icon name="down" size={20} />
              </button>
              <button className="icon-btn danger-text" onClick={() => removeRow(i)} aria-label="הסר">
                <Icon name="trash" size={20} />
              </button>
            </div>
            <div className="tpl-grid">
              <div>
                <span className="field-label">סטים</span>
                <Stepper compact label="סטים" value={r.sets} step={1} min={1} max={10} onChange={(v) => setRow(i, { sets: v ?? 1 })} />
              </div>
              <div>
                <span className="field-label">מנוחה ({clock(r.rest)})</span>
                <Stepper
                  compact
                  label="מנוחה בשניות"
                  value={r.rest}
                  step={15}
                  min={0}
                  max={600}
                  onChange={(v) => setRow(i, { rest: v ?? 0 })}
                />
              </div>
              <div>
                <span className="field-label">חזרות מינימום</span>
                <Stepper
                  compact
                  label="חזרות מינימום"
                  value={r.repMin}
                  step={1}
                  min={1}
                  max={100}
                  onChange={(v) => setRow(i, { repMin: v ?? 1, repMax: Math.max(r.repMax, v ?? 1) })}
                />
              </div>
              <div>
                <span className="field-label">חזרות מקסימום</span>
                <Stepper
                  compact
                  label="חזרות מקסימום"
                  value={r.repMax}
                  step={1}
                  min={1}
                  max={100}
                  onChange={(v) => setRow(i, { repMax: v ?? 1, repMin: Math.min(r.repMin, v ?? 1) })}
                />
              </div>
            </div>
          </div>
        )
      })}

      <button className="btn btn-block dashed" onClick={() => setAdding(true)}>
        <Icon name="plus" /> הוסף תרגיל
      </button>

      {(templateCount ?? 0) > 1 && (
        <button className="btn btn-ghost btn-block danger-text" onClick={removeTemplate}>
          <Icon name="trash" size={18} /> מחק את אימון {tpl.name}
        </button>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="הוספת תרגיל">
        <input
          className="input"
          dir="ltr"
          placeholder="חיפוש או שם תרגיל חדש"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {q && !exercises.some((e) => e.name.toLowerCase() === q) && (
          <button className="menu-item accent" onClick={createExercise}>
            <Icon name="plus" /> צור תרגיל חדש: <bdi>{query.trim()}</bdi>
          </button>
        )}
        <div className="menu">
          {matches.map((e) => (
            <button className="menu-item" key={e.id} onClick={() => addExercise(e)}>
              <bdi>{e.name}</bdi>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
