import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getActiveSession, type Exercise, type Session, type SessionExercise } from '../db'
import { ExerciseImage } from '../components/ExerciseImage'
import { useConfirm, useToast } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { RestTimer } from '../components/RestTimer'
import { SetsText } from '../components/SetsText'
import { Sheet } from '../components/Sheet'
import { Stepper } from '../components/Stepper'
import { cancelBeep, unlockAudio } from '../lib/alerts'
import { clock, kg, relDay, stopwatch } from '../lib/format'
import { useNow } from '../lib/hooks'
import { go } from '../lib/router'
import { useSettings } from '../lib/settings'
import { findNext, isComplete } from '../lib/workout'
import { useWakeLock } from '../lib/wakelock'

export default function Workout() {
  const [s, setS] = useState<Session | null>()
  const exMap = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e])), [])
  const settings = useSettings()
  const confirm = useConfirm()
  const toast = useToast()
  const now = useNow(1000)
  const [menuFor, setMenuFor] = useState<number | null>(null)
  const [noteFor, setNoteFor] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const cards = useRef(new Map<string, HTMLElement>())
  const firstScroll = useRef(true)

  useWakeLock(!!settings?.keepAwake && !!s)

  useEffect(() => {
    void getActiveSession().then(setS)
  }, [])

  useEffect(() => {
    if (s === null) go('/', { replace: true })
  }, [s])

  /** Change the session and save it to the device immediately. */
  const update = useCallback((fn: (d: Session) => void) => {
    setS((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      void db.sessions.put(next)
      return next
    })
  }, [])

  // Keep the current exercise in view.
  const currentKey = s?.exercises[s.current]?.key
  useEffect(() => {
    if (!currentKey) return
    const el = cards.current.get(currentKey)
    if (!el) return
    if (firstScroll.current) {
      firstScroll.current = false
      if (s?.current === 0) return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentKey, s?.current])

  if (!s || !exMap || !settings) return <div className="loading" />

  const totalSets = s.exercises.reduce((n, e) => n + (e.skipped ? 0 : e.sets.length), 0)
  const doneCount = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)

  // ---------- actions ----------
  const toggleSet = (ei: number, si: number) => {
    const se = s.exercises[ei]
    const set = se.sets[si]
    if (!set.done) {
      if ((set.reps ?? 0) <= 0) return toast('צריך להזין מספר חזרות')
      if (set.weight == null && se.equipment !== 'bodyweight') return toast('צריך להזין משקל')
      unlockAudio()
    }
    // will this tap finish the whole workout?
    const allDone =
      !set.done &&
      s.exercises.every((e, k) => (k === ei ? e.skipped || e.sets.every((x, j) => j === si || x.done) : isComplete(e)))
    update((d) => {
      const e = d.exercises[ei]
      const t = e.sets[si]
      if (t.done) {
        t.done = false
        t.doneAt = undefined
        return
      }
      t.done = true
      t.doneAt = Date.now()
      if (t.weight == null) t.weight = 0
      // carry this set's values forward to the next sets the user hasn't touched
      for (let k = si + 1; k < e.sets.length; k++) {
        const n = e.sets[k]
        if (n.done || n.touched) continue
        if (t.touched || n.weight == null) n.weight = t.weight
        if (n.reps == null) n.reps = t.reps
      }
      if (e.sets.every((x) => x.done)) {
        const nxt = findNext(d, ei)
        if (nxt !== -1) d.current = nxt
      }
      d.rest = allDone ? null : { endsAt: Date.now() + e.rest * 1000, duration: e.rest, label: e.name }
    })
    if (allDone) toast('סיימת את כל התרגילים! 💪 לחץ על "סיים"')
  }

  const setField = (ei: number, si: number, field: 'weight' | 'reps', v: number | null) =>
    update((d) => {
      const t = d.exercises[ei].sets[si]
      t[field] = v
      t.touched = true
    })

  const addSet = (ei: number) =>
    update((d) => {
      const e = d.exercises[ei]
      const last = e.sets[e.sets.length - 1]
      e.sets.push({ weight: last?.weight ?? null, reps: last?.reps ?? null, done: false })
    })

  const removeSet = (ei: number) =>
    update((d) => {
      const e = d.exercises[ei]
      if (e.sets.length > 1 && !e.sets[e.sets.length - 1].done) e.sets.pop()
    })

  const move = (ei: number, to: number) =>
    update((d) => {
      if (to < 0 || to >= d.exercises.length || to === ei) return
      const curKey = d.exercises[d.current]?.key
      const [it] = d.exercises.splice(ei, 1)
      d.exercises.splice(to, 0, it)
      d.current = Math.max(0, d.exercises.findIndex((x) => x.key === curKey))
    })

  /** Machine taken: send the exercise to the end of the queue and continue with the next one. */
  const postpone = (ei: number) =>
    update((d) => {
      const wasCurrent = d.current === ei
      const curKey = d.exercises[d.current]?.key
      const [it] = d.exercises.splice(ei, 1)
      d.exercises.push(it)
      if (wasCurrent) {
        const n = findNext(d, ei - 1)
        d.current = n === -1 ? d.exercises.length - 1 : n
      } else d.current = Math.max(0, d.exercises.findIndex((x) => x.key === curKey))
    })

  const toggleSkip = (ei: number) =>
    update((d) => {
      const e = d.exercises[ei]
      e.skipped = !e.skipped
      if (e.skipped && d.current === ei) {
        const n = findNext(d, ei)
        if (n !== -1) d.current = n
      }
      if (!e.skipped) d.current = ei
    })

  const applySuggestion = (ei: number) =>
    update((d) => {
      const e = d.exercises[ei]
      if (!e.suggestion) return
      e.suggestion.state = 'applied'
      for (const t of e.sets)
        if (!t.done) {
          t.weight = e.suggestion.weight
          t.reps = e.repMin
          t.touched = true
        }
    })

  const dismissSuggestion = (ei: number) =>
    update((d) => {
      const e = d.exercises[ei]
      if (e.suggestion) e.suggestion.state = 'dismissed'
    })

  const openNote = (ei: number) => {
    setNoteText(s.exercises[ei].note)
    setNoteFor(ei)
  }

  const finish = async () => {
    if (doneCount === 0) {
      const ok = await confirm({
        title: 'לא סומנו סטים',
        message: 'לבטל את האימון בלי לשמור אותו?',
        confirmText: 'בטל אימון',
        danger: true,
      })
      if (ok) {
        cancelBeep()
        await db.sessions.delete(s.id)
        go('/', { replace: true })
      }
      return
    }
    const left = totalSets - doneCount
    const ok = await confirm({
      title: 'לסיים את האימון?',
      message: left > 0 ? `נשארו ${left} סטים שלא סומנו – הם לא יישמרו.` : 'כל הסטים בוצעו. כל הכבוד!',
      confirmText: 'סיים אימון',
    })
    if (!ok) return
    const final = structuredClone(s)
    final.status = 'done'
    final.finishedAt = Date.now()
    final.rest = null
    for (const e of final.exercises) e.sets = e.sets.filter((x) => x.done).map(({ touched: _t, ...rest }) => rest)
    cancelBeep()
    await db.sessions.put(final)
    go(`/summary/${final.id}`, { replace: true })
  }

  const cancelWorkout = async () => {
    const ok = await confirm({
      title: 'לבטל את האימון?',
      message: 'כל מה שנרשם באימון הזה יימחק.',
      confirmText: 'מחק אימון',
      danger: true,
    })
    if (!ok) return
    cancelBeep()
    await db.sessions.delete(s.id)
    go('/', { replace: true })
  }

  // ---------- render ----------
  const renderCard = (se: SessionExercise, ei: number) => {
    const ex: Exercise | undefined = exMap.get(se.exerciseId)
    const isCur = ei === s.current
    const complete = isComplete(se)
    const doneN = se.sets.filter((x) => x.done).length
    const bw = se.equipment === 'bodyweight'

    return (
      <section
        key={se.key}
        ref={(el) => {
          if (el) cards.current.set(se.key, el)
          else cards.current.delete(se.key)
        }}
        className={`ex-card ${isCur ? 'current' : ''} ${complete ? 'complete' : ''} ${se.skipped ? 'skipped' : ''}`}
      >
        <button
          className="ex-head"
          onClick={() => {
            if (!isCur) update((d) => void (d.current = ei))
          }}
          aria-expanded={isCur}
        >
          <ExerciseImage ex={ex} size="thumb" />
          <div className="ex-head-text">
            <div className="ex-name">
              <bdi>{se.name}</bdi>
            </div>
            <div className="ex-meta">
              {se.sets.length} סטים · {se.repMin}-{se.repMax} חזרות · מנוחה {clock(se.rest)}
            </div>
          </div>
          <div className={`ex-status ${complete && !se.skipped ? 'ok' : ''}`}>
            {se.skipped ? 'דולג' : complete ? <Icon name="check" size={20} stroke={3} /> : `${doneN}/${se.sets.length}`}
          </div>
        </button>

        {isCur && (
          <div className="ex-body">
            <ExerciseImage ex={ex} />
            {!!ex?.cues?.length && (
              <ul className="cues">
                {ex.cues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
            {ex?.note && (
              <div className="callout warn">
                <Icon name="alert" size={20} />
                <span>{ex.note}</span>
              </div>
            )}

            {se.prev ? (
              <div className="prev">
                <span className="prev-label">בפעם הקודמת</span>
                <span className="prev-val">
                  <SetsText sets={se.prev.sets} bodyweight={bw} />
                </span>
                <span className="prev-date">{relDay(se.prev.date, now)}</span>
              </div>
            ) : (
              <div className="prev">
                <span className="prev-label">פעם ראשונה בתרגיל – בחר משקל התחלתי</span>
              </div>
            )}

            {se.suggestion?.state === 'open' && (
              <div className="callout accent">
                <div className="callout-title">
                  <Icon name="target" size={20} /> זמן להעלות משקל
                </div>
                <div>
                  בפעם הקודמת הגעת ל-{se.repMax} חזרות בכל הסטים. הצעה: <b>{kg(se.suggestion.weight)} ק״ג</b>
                  {bw ? ' תוספת' : ''} (<bdi dir="ltr">+{kg(se.increment)}</bdi> ק״ג).
                </div>
                <div className="row-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => applySuggestion(ei)}>
                    עדכן ל-{kg(se.suggestion.weight)} ק״ג
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => dismissSuggestion(ei)}>
                    לא הפעם
                  </button>
                </div>
              </div>
            )}

            {se.note && (
              <button className="callout note" onClick={() => openNote(ei)}>
                <Icon name="note" size={18} />
                <span>{se.note}</span>
              </button>
            )}

            <div className="sets">
              <div className="set-row head">
                <span>סט</span>
                <span>{bw ? 'תוספת ק״ג' : 'ק״ג'}</span>
                <span>חזרות</span>
                <span />
              </div>
              {se.sets.map((t, si) => (
                <div key={si} className={`set-row ${t.done ? 'done' : ''}`}>
                  <span className="set-num">{si + 1}</span>
                  <Stepper
                    label="משקל"
                    value={t.weight}
                    step={se.increment}
                    decimals
                    placeholder={bw ? '0' : 'ק״ג'}
                    onChange={(v) => setField(ei, si, 'weight', v)}
                  />
                  <Stepper
                    label="חזרות"
                    value={t.reps}
                    step={1}
                    max={200}
                    placeholder={`${se.repMin}-${se.repMax}`}
                    onChange={(v) => setField(ei, si, 'reps', v)}
                  />
                  <button
                    className={`check ${t.done ? 'on' : ''}`}
                    onClick={() => toggleSet(ei, si)}
                    aria-label={t.done ? `בטל סימון סט ${si + 1}` : `סמן סט ${si + 1} כבוצע`}
                    aria-pressed={t.done}
                  >
                    <Icon name="check" size={26} stroke={3} />
                  </button>
                </div>
              ))}
            </div>

            <div className="set-tools">
              <button className="btn btn-sm" onClick={() => addSet(ei)}>
                <Icon name="plus" size={18} /> סט
              </button>
              {se.sets.length > 1 && !se.sets[se.sets.length - 1].done && (
                <button className="btn btn-sm" onClick={() => removeSet(ei)}>
                  <Icon name="minus" size={18} /> סט
                </button>
              )}
            </div>

            <div className="ex-actions">
              <button onClick={() => openNote(ei)}>
                <Icon name="note" />
                <span>הערה</span>
              </button>
              <button onClick={() => toggleSkip(ei)}>
                <Icon name="skip" />
                <span>דלג</span>
              </button>
              <button onClick={() => postpone(ei)} disabled={ei === s.exercises.length - 1}>
                <Icon name="to-end" />
                <span>לסוף</span>
              </button>
              <button onClick={() => setMenuFor(ei)}>
                <Icon name="more" />
                <span>עוד</span>
              </button>
            </div>
          </div>
        )}
      </section>
    )
  }

  const menuEx = menuFor != null ? s.exercises[menuFor] : null

  return (
    <div className={`workout ${s.rest ? 'has-rest' : ''}`}>
      <header className="topbar workout-top">
        <button className="icon-btn" onClick={() => go('/')} aria-label="חזרה למסך הבית">
          <Icon name="chev-right" size={26} />
        </button>
        <div className="wt-title">
          <div className="wt-name">אימון {s.templateName}</div>
          <div className="wt-sub">
            <span className="num">{stopwatch(now - s.startedAt)}</span> · {doneCount}/{totalSets} סטים
          </div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={finish}>
          סיים אימון
        </button>
      </header>
      <div className="wt-progress">
        <div style={{ width: `${totalSets ? (doneCount / totalSets) * 100 : 0}%` }} />
      </div>

      {s.exercises.map(renderCard)}

      <button className="btn btn-ghost btn-block danger-text" onClick={cancelWorkout}>
        <Icon name="trash" size={18} /> בטל אימון
      </button>

      {s.rest && (
        <RestTimer
          rest={s.rest}
          sound={settings.sound}
          vibration={settings.vibration}
          onAdd={() =>
            update((d) => {
              if (!d.rest) return
              const base = Math.max(d.rest.endsAt, Date.now())
              d.rest.endsAt = base + 30000
              d.rest.duration = Math.max(d.rest.duration, (d.rest.endsAt - Date.now()) / 1000)
            })
          }
          onSkip={() => update((d) => void (d.rest = null))}
          onClear={() => update((d) => void (d.rest = null))}
        />
      )}

      <Sheet open={menuEx != null} onClose={() => setMenuFor(null)} title={menuEx && <bdi>{menuEx.name}</bdi>}>
        {menuEx && menuFor != null && (
          <div className="menu">
            {menuFor !== s.current && (
              <button className="menu-item" onClick={() => (update((d) => void (d.current = menuFor)), setMenuFor(null))}>
                <Icon name="play" /> בצע עכשיו
              </button>
            )}
            <button className="menu-item" disabled={menuFor === 0} onClick={() => (move(menuFor, menuFor - 1), setMenuFor(menuFor - 1))}>
              <Icon name="up" /> הזז למעלה
            </button>
            <button
              className="menu-item"
              disabled={menuFor === s.exercises.length - 1}
              onClick={() => (move(menuFor, menuFor + 1), setMenuFor(menuFor + 1))}
            >
              <Icon name="down" /> הזז למטה
            </button>
            <button className="menu-item" onClick={() => (postpone(menuFor), setMenuFor(null))}>
              <Icon name="to-end" /> העבר לסוף (מכונה תפוסה)
            </button>
            <button className="menu-item" onClick={() => (toggleSkip(menuFor), setMenuFor(null))}>
              <Icon name={menuEx.skipped ? 'undo' : 'skip'} /> {menuEx.skipped ? 'בטל דילוג' : 'דלג על התרגיל'}
            </button>
            <button className="menu-item" onClick={() => (openNote(menuFor), setMenuFor(null))}>
              <Icon name="note" /> הערה לתרגיל
            </button>
            <button className="menu-item" onClick={() => go(`/exercise/${menuEx.exerciseId}`)}>
              <Icon name="chart" /> התקדמות בתרגיל
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={noteFor != null} onClose={() => setNoteFor(null)} title="הערה לתרגיל">
        <textarea
          className="textarea"
          rows={4}
          value={noteText}
          autoFocus
          placeholder="למשל: מושב בגובה 4, כאב קל בכתף…"
          onChange={(e) => setNoteText(e.target.value)}
        />
        <button
          className="btn btn-primary btn-block mt"
          onClick={() => {
            if (noteFor != null) update((d) => void (d.exercises[noteFor].note = noteText.trim()))
            setNoteFor(null)
          }}
        >
          שמור הערה
        </button>
      </Sheet>
    </div>
  )
}
