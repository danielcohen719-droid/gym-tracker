interface Props {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, hint, value, onChange }: Props) {
  return (
    <button className="switch-row" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span className="switch-text">
        <span>{label}</span>
        {hint && <span className="row-sub">{hint}</span>}
      </span>
      <span className={`toggle ${value ? 'on' : ''}`} />
    </button>
  )
}
