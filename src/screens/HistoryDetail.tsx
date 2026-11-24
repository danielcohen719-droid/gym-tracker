import { useLiveQuery } from 'dexie-react-hooks'
import { db, getDoneSessions } from '../db'
import { useConfirm, useToast } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { PRList, SessionSets, SessionTiles } from '../components/SessionView'
import { TopBar } from '../components/TopBar'
import { longDate, timeOfDay } from '../lib/format'
import { back } from '../lib/router'
import { findPRs } from '../lib/stats'

export default function HistoryDetail({ id }: { id: string }) {
  const data = useLiveQuery(async () => {
    const s = await db.sessions.get(id)
    if (!s) return null
    return { s, all: await getDoneSessions() }
  }, [id])
  const confirm = useConfirm()
  const toast = useToast()

  if (data === undefined) return <div className="loading" />
  if (data === null)
    return (
      <>
        <TopBar title="אימון" backTo="/history" />
        <p className="muted">האימון לא נמצא.</p>
      </>
    )
  const { s, all } = data

  const remove = async () => {
    const ok = await confirm({
      title: 'למחוק את האימון?',
      message: 'האימון יימחק מההיסטוריה ומהגרפים. אי אפשר לבטל.',
      confirmText: 'מחק',
      danger: true,
    })
    if (!ok) return
    await db.sessions.delete(s.id)
    toast('האימון נמחק')
    back('/history')
  }

  return (
    <div className="stack">
      <TopBar title={`אימון ${s.templateName}`} backTo="/history" />
      <div className="muted">
        {longDate(s.startedAt)} · {timeOfDay(s.startedAt)}
      </div>
      <SessionTiles s={s} />
      <PRList prs={findPRs(s, all)} />
      <div className="section-title">תרגילים</div>
      <SessionSets s={s} />
      <button className="btn btn-ghost btn-block danger-text" onClick={remove}>
        <Icon name="trash" size={18} /> מחק אימון
      </button>
    </div>
  )
}
