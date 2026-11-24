import { useEffect, useState } from 'react'

const EVT = 'app:route'

function read(): string {
  return window.location.hash.replace(/^#/, '') || '/'
}

function depth(): number {
  const s = history.state as { depth?: number } | null
  return s?.depth ?? 0
}

/** Current route split into segments, e.g. "#/history/abc" -> ["history", "abc"] */
export function useRoute(): string[] {
  const [path, setPath] = useState(read)
  useEffect(() => {
    const on = () => setPath(read())
    window.addEventListener('popstate', on)
    window.addEventListener('hashchange', on)
    window.addEventListener(EVT, on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('hashchange', on)
      window.removeEventListener(EVT, on)
    }
  }, [])
  return path.split('/').filter(Boolean)
}

interface GoOptions {
  /** replace the current history entry */
  replace?: boolean
  /** top-level tab: reset the in-app back stack */
  root?: boolean
}

export function go(path: string, opts: GoOptions = {}) {
  const url = '#' + path
  if (opts.root) history.replaceState({ depth: 0 }, '', url)
  else if (opts.replace) history.replaceState({ depth: depth() }, '', url)
  else history.pushState({ depth: depth() + 1 }, '', url)
  window.dispatchEvent(new Event(EVT))
  window.scrollTo(0, 0)
}

/** Go back inside the app, or to `fallback` when there is nothing to go back to. */
export function back(fallback: string) {
  if (depth() > 0) history.back()
  else go(fallback, { replace: true })
}
