import { createContext, useCallback, useContext, useState } from 'react'
import { Check, Heart, X } from 'lucide-react'
import Modal from '../components/Modal'

const UIContext = createContext(null)

/** Avisos bonitinhos (toasts) e janelas de confirmação no lugar dos alerts do navegador. */
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [ask, setAsk] = useState(null)

  const toast = useCallback((text, type = 'ok') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 6000 : 3200)
  }, [])

  const confirm = useCallback(
    (options) => new Promise((resolve) => setAsk({ confirmLabel: 'Confirmar', danger: false, ...options, resolve })),
    [],
  )

  const answer = (value) => {
    ask?.resolve(value)
    setAsk(null)
  }

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-xl ${
              t.type === 'error'
                ? 'bg-rose-50/95 text-rose-700 ring-1 ring-rose-200'
                : 'bg-white/95 text-violet-800 ring-1 ring-violet-100'
            }`}
          >
            {t.type === 'error' ? <X className="size-4 shrink-0" /> : <Heart className="size-4 shrink-0 fill-fuchsia-400 text-fuchsia-400" />}
            <span className="whitespace-pre-line">{t.text}</span>
          </div>
        ))}
      </div>

      <Modal open={Boolean(ask)} onClose={() => answer(false)} title={ask?.title ?? ''} size="sm">
        {ask?.text && <p className="text-violet-700">{ask.text}</p>}
        <div className="mt-6 flex gap-2">
          <button className="btn-soft flex-1" onClick={() => answer(false)}>Cancelar</button>
          <button className={`${ask?.danger ? 'btn-danger' : 'btn'} flex-1`} onClick={() => answer(true)}>
            <Check className="size-4" /> {ask?.confirmLabel}
          </button>
        </div>
      </Modal>
    </UIContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => useContext(UIContext)
