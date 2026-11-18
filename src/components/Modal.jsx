import { useEffect } from 'react'
import { X } from 'lucide-react'

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl' }

export default function Modal({ open, onClose, title, icon: Icon, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-violet-950/30 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`pop-in max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl shadow-violet-900/20 sm:rounded-[2rem] sm:p-7 ${SIZES[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-violet-100 sm:hidden" />
        <div className="mb-5 flex items-start gap-3">
          {Icon && (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-300/50">
              <Icon className="size-5" />
            </span>
          )}
          <h2 className="flex-1 pt-1 font-display text-2xl font-bold leading-tight text-violet-950">{title}</h2>
          <button onClick={onClose} className="btn-icon -mr-2 -mt-1" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
