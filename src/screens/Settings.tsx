import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfirm, useToast } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { Toggle } from '../components/Toggle'
import { exportBackup, readBackup, restoreBackup } from '../lib/backup'
import { daysSince, relDay, shortDate } from '../lib/format'
import { isStandalone } from '../lib/hooks'
import { setSetting, useSettings } from '../lib/settings'

export default function Settings() {
  const settings = useSettings()
  const counts = useLiveQuery(async () => ({ sessions: await db.sessions.where('status').equals('done').count() }), [])
  const confirm = useConfirm()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  if (!settings || !counts) return <div className="loading" />

  const doExport = async () => {
    try {
      const r = await exportBackup()
      if (r === 'shared') toast('הגיבוי נשמר ✓')
      if (r === 'downloaded') toast('קובץ הגיבוי הורד ✓')
    } catch {
      toast('הגיבוי נכשל, נסה שוב')
    }
  }

  const doImport = async (file: File) => {
    try {
      const data = await readBackup(file)
      const n = data.sessions.filter((s) => s.status === 'done').length
      const ok = await confirm({
        title: 'לשחזר מהגיבוי?',
        message: `בגיבוי יש ${n} אימונים (${new Date(data.exportedAt).toLocaleDateString('he-IL')}). כל הנתונים הנוכחיים במכשיר יוחלפו בנתוני הגיבוי.`,
        confirmText: 'שחזר',
        danger: true,
      })
      if (!ok) return
      await restoreBackup(data)
      toast('הנתונים שוחזרו ✓')
    } catch (e) {
      toast((e as Error).message || 'השחזור נכשל')
    }
  }

  const resetAll = async () => {
    const ok = await confirm({
      title: 'למחוק את כל הנתונים?',
      message: 'כל האימונים, ההיסטוריה והשינויים בתוכנית יימחקו מהמכשיר. מומלץ לגבות קודם. אי אפשר לבטל.',
      confirmText: 'מחק הכל',
      danger: true,
    })
    if (!ok) return
    await db.delete()
    location.reload()
  }

  const offlineReady = (() => {
    try {
      return localStorage.getItem('offlineReady') === '1' || !!navigator.serviceWorker?.controller
    } catch {
      return false
    }
  })()

  return (
    <div className="stack">
      <h1 className="page-title">הגדרות</h1>

      <section className="card">
        <div className="card-title">
          <Icon name="download" /> גיבוי
        </div>
        <p className="muted small">
          הנתונים שמורים רק במכשיר הזה. אם מוחקים את האפליקציה או את נתוני Safari – הם נעלמים. כדאי לגבות פעם בחודש
          ולשמור את הקובץ ב"קבצים" (iCloud Drive).
        </p>
        <div className="kv">
          <span>גיבוי אחרון</span>
          <b>
            {settings.lastBackupAt
              ? daysSince(settings.lastBackupAt) < 7
                ? relDay(settings.lastBackupAt)
                : `${shortDate(settings.lastBackupAt)} (לפני ${daysSince(settings.lastBackupAt)} ימים)`
              : 'עוד לא בוצע'}
          </b>
        </div>
        <div className="kv">
          <span>אימונים שמורים</span>
          <b>{counts.sessions}</b>
        </div>
        <button className="btn btn-primary btn-block mt" onClick={doExport}>
          <Icon name="share" /> ייצוא גיבוי (JSON)
        </button>
        <button className="btn btn-block mt" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" /> שחזור מקובץ גיבוי
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void doImport(f)
          }}
        />
      </section>

      <section className="card">
        <div className="card-title">
          <Icon name="timer" /> טיימר מנוחה
        </div>
        <Toggle label="צליל בסיום המנוחה" value={settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle
          label="רטט בסיום המנוחה"
          hint="באייפון: רטט קצר (iOS 18 ומעלה)"
          value={settings.vibration}
          onChange={(v) => setSetting('vibration', v)}
        />
        <Toggle
          label="השאר מסך דלוק באימון"
          hint="מומלץ – כשהמסך כבוי הטיימר לא יכול לצפצף"
          value={settings.keepAwake}
          onChange={(v) => setSetting('keepAwake', v)}
        />
      </section>

      <section className="card">
        <div className="card-title">
          <Icon name="info" /> מצב האפליקציה
        </div>
        <div className="kv">
          <span>מותקנת על מסך הבית</span>
          <b>{isStandalone() ? 'כן ✓' : 'לא'}</b>
        </div>
        <div className="kv">
          <span>מוכנה לעבודה בלי אינטרנט</span>
          <b>{offlineReady ? 'כן ✓' : 'עדיין לא'}</b>
        </div>
        {persisted !== null && (
          <div className="kv">
            <span>אחסון קבוע</span>
            <b>{persisted ? 'כן ✓' : 'לא מובטח'}</b>
          </div>
        )}
        {!isStandalone() && (
          <p className="muted small mt">
            להתקנה באייפון: פתח ב-Safari ← כפתור השיתוף ⬆️ ← "הוסף למסך הבית".
          </p>
        )}
        <p className="muted small mt">תמונות התרגילים: free-exercise-db (נחלת הכלל).</p>
      </section>

      <button className="btn btn-ghost btn-block danger-text" onClick={resetAll}>
        <Icon name="trash" size={18} /> מחק את כל הנתונים
      </button>
    </div>
  )
}
