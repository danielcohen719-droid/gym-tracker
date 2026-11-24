const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  history: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 7v5l3 2',
  chart: 'M3 3v18h18M7 15l4-4 3 3 6-7',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  check: 'M20 6 9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  'chev-right': 'm9 18 6-6-6-6',
  'chev-left': 'm15 18-6-6 6-6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  note: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  skip: 'M5 4l10 8-10 8zM19 5v14',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  'to-end': 'M7 6l5 5 5-5M7 13l5 5 5-5',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  x: 'M18 6 6 18M6 6l12 12',
  play: 'M7 4v16l13-8z',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  upload: 'M12 15V3M7 8l5-5 5 5M5 21h14',
  dumbbell: 'M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12',
  timer: 'M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM12 9v4l2 2M9 2h6',
  alert: 'M12 3 2 21h20zM12 10v4M12 17.5h.01',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 16v-4M12 8h.01',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  target: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 12h.01',
  share: 'M4 12v8h16v-8M12 3v12M8 7l4-4 4 4',
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  flame: 'M12 22c4 0 7-3 7-7 0-5-4-7-5-11-2 2-3 4-3 6-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z',
}

interface Props {
  name: keyof typeof PATHS | string
  size?: number
  stroke?: number
  className?: string
}

export function Icon({ name, size = 22, stroke = 2, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3.2 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}
