import { useEffect, useRef, useState } from 'react'
import { round2 } from '../lib/format'

interface Props {
  value: number | null
  onChange: (v: number | null) => void
  step: number
  min?: number
  max?: number
  decimals?: boolean
  placeholder?: string
  label: string
  compact?: boolean
  /** how to display the value (e.g. seconds as m:ss) — only used while not editing */
  display?: (v: number) => string
}

const fmt = (v: number | null) => (v == null ? '' : String(round2(v)))

/** Big −/+ number field. Tapping the number opens the numeric keyboard. */
export function Stepper({ value, onChange, step, min = 0, max = 9999, decimals, placeholder, label, compact, display }: Props) {
  const [text, setText] = useState(fmt(value))
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setText(fmt(value))
  }, [value, editing])

  const clamp = (n: number) => Math.min(max, Math.max(min, round2(n)))
  const bump = (dir: 1 | -1) => {
    if (value == null) onChange(clamp(dir === 1 ? Math.max(min, step) : min))
    else onChange(clamp(value + dir * step))
  }

  return (
    <div className={`stepper ${compact ? 'compact' : ''}`}>
      <button type="button" onClick={() => bump(-1)} aria-label={`הפחת ${label}`} tabIndex={-1}>
        −
      </button>
      <input
        ref={ref}
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        aria-label={label}
        placeholder={placeholder}
        value={!editing && display && value != null ? display(value) : text}
        onFocus={() => {
          setEditing(true)
          setText(fmt(value))
          requestAnimationFrame(() => ref.current?.select())
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') ref.current?.blur()
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(',', '.').replace(/[^\d.]/g, '')
          setText(raw)
          if (raw === '') return onChange(null)
          const n = Number(raw)
          if (Number.isFinite(n)) onChange(Math.min(max, round2(n)))
        }}
      />
      <button type="button" onClick={() => bump(1)} aria-label={`הוסף ${label}`} tabIndex={-1}>
        +
      </button>
    </div>
  )
}
