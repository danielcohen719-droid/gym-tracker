import { useState, type PointerEvent } from 'react'
import { dm, kg, shortDate } from '../lib/format'

export interface ChartSeries {
  label: string
  color: string
  values: number[]
}

interface Props {
  dates: number[]
  series: ChartSeries[]
  unit?: string
}

function niceStep(raw: number): number {
  if (raw <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

const W = 340
const H = 200
const L = 36
const R = 12
const T = 12
const B = 26

/** Simple time-based line chart (SVG). Tap/drag to read values. */
export function LineChart({ dates, series, unit = 'ק״ג' }: Props) {
  const [sel, setSel] = useState<number | null>(null)
  if (!dates.length) return null

  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v))
  let lo = Math.min(...all)
  let hi = Math.max(...all)
  if (lo === hi) {
    lo -= 5
    hi += 5
  }
  const pad = (hi - lo) * 0.1
  lo = Math.max(0, lo - pad)
  hi += pad
  const step = niceStep((hi - lo) / 4)
  const y0 = Math.floor(lo / step) * step
  const y1 = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let v = y0; v <= y1 + step / 1000; v += step) ticks.push(Math.round(v * 100) / 100)

  const t0 = dates[0]
  const t1 = dates[dates.length - 1]
  const x = (i: number) => (dates.length === 1 ? (L + W - R) / 2 : L + ((dates[i] - t0) / (t1 - t0 || 1)) * (W - L - R))
  const y = (v: number) => T + (1 - (v - y0) / (y1 - y0 || 1)) * (H - T - B)

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    for (let i = 1; i < dates.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    setSel(best)
  }

  const labelIdx = dates.length <= 2 ? dates.map((_, i) => i) : [0, Math.floor((dates.length - 1) / 2), dates.length - 1]

  return (
    <div className="chart">
      <div className="chart-readout">
        {sel == null ? (
          <span className="muted">גע בגרף כדי לראות ערכים</span>
        ) : (
          <>
            <b>{shortDate(dates[sel])}</b>
            {series.map((s) => (
              <span key={s.label}>
                <i style={{ background: s.color }} />
                {s.label}: {kg(Math.round(s.values[sel] * 10) / 10)} {unit}
              </span>
            ))}
          </>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ direction: 'ltr' }}
        onPointerDown={pick}
        onPointerMove={(e) => {
          if (e.buttons) pick(e)
        }}
        role="img"
        aria-label="גרף התקדמות"
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" className="axis">
              {kg(v)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 && dates.length > 1 ? 'start' : i === dates.length - 1 && dates.length > 1 ? 'end' : 'middle'} className="axis">
            {dm(dates[i])}
          </text>
        ))}
        {sel != null && <line x1={x(sel)} x2={x(sel)} y1={T} y2={H - B} className="cursor" />}
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={sel === i ? 5 : 3} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
