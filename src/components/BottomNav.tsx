import { go } from '../lib/router'
import { Icon } from './Icon'

const TABS = [
  { path: '/', key: '', label: 'בית', icon: 'home' },
  { path: '/history', key: 'history', label: 'היסטוריה', icon: 'history' },
  { path: '/progress', key: 'progress', label: 'התקדמות', icon: 'chart' },
  { path: '/plan', key: 'plan', label: 'תוכנית', icon: 'list' },
  { path: '/settings', key: 'settings', label: 'הגדרות', icon: 'settings' },
]

const OWNER: Record<string, string> = { exercise: 'progress' }

export function BottomNav({ active }: { active: string }) {
  const current = OWNER[active] ?? active
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={current === t.key ? 'active' : ''}
          onClick={() => go(t.path, { root: true })}
          aria-current={current === t.key ? 'page' : undefined}
        >
          <Icon name={t.icon} size={24} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
