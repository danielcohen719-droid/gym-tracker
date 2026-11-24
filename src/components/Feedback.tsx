import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmOpts {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}
type ConfirmFn = (o: ConfirmOpts) => Promise<boolean>
type ToastFn = (msg: string) => void

const Ctx = createContext<{ confirm: ConfirmFn; toast: ToastFn } | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const confirm = useCallback<ConfirmFn>((o) => new Promise((resolve) => setDlg({ ...o, resolve })), [])
  const toast = useCallback<ToastFn>((text) => {
    setMsg({ text, id: Date.now() })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 2800)
  }, [])
  const value = useMemo(() => ({ confirm, toast }), [confirm, toast])

  const close = (v: boolean) => {
    dlg?.resolve(v)
    setDlg(null)
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      {dlg &&
        createPortal(
          <div className="backdrop center" onClick={() => close(false)}>
            <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2>{dlg.title}</h2>
              {dlg.message && <p>{dlg.message}</p>}
              <div className="dialog-actions">
                <button className="btn" onClick={() => close(false)}>
                  {dlg.cancelText ?? 'ביטול'}
                </button>
                <button className={`btn ${dlg.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>
                  {dlg.confirmText ?? 'אישור'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {msg &&
        createPortal(
          <div className="toast" role="status" key={msg.id}>
            {msg.text}
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  )
}

export const useConfirm = () => useContext(Ctx)!.confirm
export const useToast = () => useContext(Ctx)!.toast
