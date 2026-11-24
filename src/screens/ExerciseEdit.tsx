import { useEffect, useRef, useState } from 'react'
import { db, DEFAULT_INCREMENT, EQUIPMENT_LABEL, type Equipment, type Exercise } from '../db'
import { ExerciseImage } from '../components/ExerciseImage'
import { Stepper } from '../components/Stepper'
import { TopBar } from '../components/TopBar'

export default function ExerciseEdit({ id }: { id: string }) {
  const [ex, setEx] = useState<Exercise | null>()
  const [cuesText, setCuesText] = useState('')
  const [saved, setSaved] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    void db.exercises.get(id).then((e) => {
      setEx(e ?? null)
      setCuesText(e?.cues.join('\n') ?? '')
    })
  }, [id])

  // Auto-save shortly after each change.
  const save = (next: Exercise) => {
    setEx(next)
    setSaved(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      await db.exercises.put(next)
      setSaved(true)
    }, 350)
  }

  if (ex === undefined) return <div className="loading" />
  if (ex === null)
    return (
      <>
        <TopBar title="עריכת תרגיל" backTo="/progress" />
        <p className="muted">התרגיל לא נמצא.</p>
      </>
    )

  return (
    <div className="stack">
      <TopBar title="עריכת תרגיל" backTo={`/exercise/${id}`} actions={<span className="saved">{saved ? 'נשמר ✓' : ''}</span>} />
      <ExerciseImage ex={ex} />

      <label className="field">
        <span className="field-label">שם התרגיל (באנגלית)</span>
        <input className="input" dir="ltr" value={ex.name} onChange={(e) => save({ ...ex, name: e.target.value })} />
      </label>

      <div className="field">
        <span className="field-label">סוג ציוד</span>
        <div className="seg">
          {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((k) => (
            <button
              key={k}
              className={ex.equipment === k ? 'on' : ''}
              onClick={() => save({ ...ex, equipment: k, increment: ex.equipment === k ? ex.increment : DEFAULT_INCREMENT[k] })}
            >
              {EQUIPMENT_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">תוספת משקל בהתקדמות (ק״ג)</span>
        <Stepper
          label="תוספת משקל"
          value={ex.increment}
          step={0.5}
          min={0.5}
          max={20}
          decimals
          onChange={(v) => save({ ...ex, increment: v ?? 0.5 })}
        />
        <span className="hint">כשכל הסטים מגיעים לרף העליון, האפליקציה תציע להוסיף את המשקל הזה.</span>
      </div>

      <label className="field">
        <span className="field-label">דגשי ביצוע (שורה לכל דגש)</span>
        <textarea
          className="textarea"
          rows={4}
          value={cuesText}
          onChange={(e) => {
            setCuesText(e.target.value)
            save({ ...ex, cues: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })
          }}
        />
      </label>

      <label className="field">
        <span className="field-label">הערה קבועה (מוצגת תמיד בתרגיל)</span>
        <textarea
          className="textarea"
          rows={2}
          value={ex.note ?? ''}
          placeholder="למשל: אם יש כאב בברך…"
          onChange={(e) => save({ ...ex, note: e.target.value || undefined })}
        />
      </label>
    </div>
  )
}
