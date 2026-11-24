import { kg } from '../lib/format'

interface S {
  weight: number | null
  reps: number | null
}

/** "22.5 ק״ג × 10, 10, 9" — or "22.5×10 · 25×8" when weights differ. */
export function SetsText({ sets, bodyweight }: { sets: S[]; bodyweight?: boolean }) {
  if (!sets.length) return <span className="muted">—</span>
  const ws = sets.map((s) => s.weight ?? 0)
  if (ws.every((w) => w === ws[0])) {
    const w = ws[0]
    return (
      <span>
        {w > 0 ? (
          <>
            {kg(w)} ק״ג{bodyweight ? ' תוספת' : ''}
          </>
        ) : (
          'משקל גוף'
        )}{' '}
        × {sets.map((s) => s.reps ?? 0).join(', ')}
      </span>
    )
  }
  return (
    <span>
      {sets.map((s, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          <bdi dir="ltr">
            {kg(s.weight ?? 0)}×{s.reps ?? 0}
          </bdi>
        </span>
      ))}
    </span>
  )
}
