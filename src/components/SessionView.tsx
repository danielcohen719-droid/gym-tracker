import type { Session } from '../db'
import { duration, kg, num } from '../lib/format'
import { doneSets, sessionSetCount, sessionVolume, type PR } from '../lib/stats'
import { Icon } from './Icon'

export function SessionTiles({ s }: { s: Session }) {
  return (
    <div className="tiles three">
      <div className="tile">
        <div className="tile-label">משך</div>
        <div className="tile-value">{s.finishedAt ? duration(s.finishedAt - s.startedAt) : '—'}</div>
      </div>
      <div className="tile">
        <div className="tile-label">נפח כולל</div>
        <div className="tile-value">
          {num(sessionVolume(s))} <span className="tile-unit">ק״ג</span>
        </div>
      </div>
      <div className="tile">
        <div className="tile-label">סטים</div>
        <div className="tile-value">{sessionSetCount(s)}</div>
      </div>
    </div>
  )
}

const PR_LABEL: Record<PR['kind'], string> = {
  weight: 'שיא משקל',
  e1rm: 'שיא 1RM משוער',
  reps: 'שיא חזרות',
}

export function PRList({ prs }: { prs: PR[] }) {
  if (!prs.length) return null
  return (
    <section>
      <div className="section-title">שיאים אישיים חדשים 🏆</div>
      <div className="list">
        {prs.map((p) => (
          <div className="row" key={p.exerciseId + p.kind}>
            <span className="pr-icon">
              <Icon name="trophy" />
            </span>
            <div className="row-main">
              <div className="row-title">
                <bdi>{p.name}</bdi>
              </div>
              <div className="row-sub">
                {PR_LABEL[p.kind]}: <b className="accent">{kg(p.value)}{p.kind === 'reps' ? '' : ' ק״ג'}</b> (קודם {kg(p.prev)})
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** All exercises and sets of a finished session. */
export function SessionSets({ s }: { s: Session }) {
  return (
    <div className="stack">
      {s.exercises.map((e) => {
        const sets = doneSets(e)
        return (
          <div className="card compact" key={e.key}>
            <div className="hist-ex-head">
              <bdi className="row-title">{e.name}</bdi>
              {e.skipped || !sets.length ? <span className="pill">{e.skipped ? 'דולג' : 'לא בוצע'}</span> : null}
            </div>
            {sets.length > 0 && (
              <ol className="set-list">
                {sets.map((x, i) => (
                  <li key={i}>
                    <span className="muted">סט {i + 1}</span>
                    <span className="num">
                      {(x.weight ?? 0) > 0 ? `${kg(x.weight)} ק״ג` : e.equipment === 'bodyweight' ? 'משקל גוף' : '0 ק״ג'} × {x.reps}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {e.note && (
              <div className="callout note">
                <Icon name="note" size={18} />
                <span>{e.note}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
