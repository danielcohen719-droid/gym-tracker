import { useEffect, useRef } from 'react'
import type { RestState } from '../db'
import { cancelBeep, scheduleBeep, vibrate } from '../lib/alerts'
import { clock } from '../lib/format'
import { useNow } from '../lib/hooks'

interface Props {
  rest: RestState
  sound: boolean
  vibration: boolean
  onAdd: () => void
  onSkip: () => void
  onClear: () => void
}

/** Floating rest countdown. Beeps + vibrates at zero, then hides itself. */
export function RestTimer({ rest, sound, vibration, onAdd, onSkip, onClear }: Props) {
  const now = useNow(250)
  const left = Math.max(0, (rest.endsAt - now) / 1000)
  const finished = left <= 0
  const clearRef = useRef(onClear)
  clearRef.current = onClear

  // Beep is scheduled on the audio clock; re-schedule when coming back to the app.
  useEffect(() => {
    if (!sound) return
    scheduleBeep(rest.endsAt)
    const onVis = () => {
      if (document.visibilityState === 'visible') scheduleBeep(rest.endsAt)
      else cancelBeep()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      cancelBeep()
    }
  }, [rest.endsAt, sound])

  // Vibrate once when reaching zero (only if it just happened), then auto-hide.
  useEffect(() => {
    if (!finished) return
    if (vibration && Date.now() - rest.endsAt < 3000) vibrate()
    const t = window.setTimeout(() => clearRef.current(), Date.now() - rest.endsAt > 8000 ? 0 : 6000)
    return () => window.clearTimeout(t)
  }, [finished, rest.endsAt, vibration])

  if (finished)
    return (
      <button className="rest finished" onClick={onClear}>
        <span className="rest-done">⏱ המנוחה נגמרה – לסט הבא!</span>
      </button>
    )

  const pct = Math.min(100, (left / rest.duration) * 100)
  return (
    <div className="rest" role="timer" aria-live="off">
      <button className="rest-btn" onClick={onAdd}>
        +30
      </button>
      <div className="rest-center">
        <div className="rest-time">{clock(Math.ceil(left))}</div>
        <div className="rest-label">
          מנוחה · <bdi>{rest.label}</bdi>
        </div>
      </div>
      <button className="rest-btn" onClick={onSkip}>
        דלג
      </button>
      <div className="rest-bar" style={{ width: `${pct}%` }} />
    </div>
  )
}
