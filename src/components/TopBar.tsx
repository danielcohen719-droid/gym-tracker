import type { ReactNode } from 'react'
import { back } from '../lib/router'
import { Icon } from './Icon'

interface Props {
  title: ReactNode
  backTo?: string
  actions?: ReactNode
}

export function TopBar({ title, backTo, actions }: Props) {
  return (
    <header className="topbar">
      {backTo !== undefined && (
        <button className="icon-btn" onClick={() => back(backTo)} aria-label="חזרה">
          <Icon name="chev-right" size={26} />
        </button>
      )}
      <h1>{title}</h1>
      {actions}
    </header>
  )
}
