import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Download, Images, ImagePlus, Pencil, Trash2, X } from 'lucide-react'
import Polaroid from './Polaroid'
import { EmptyState, Spinner } from './Decor'
import { useUI } from '../lib/ui'

export default function Photos({ photos, openPhoto }) {
  const { toast } = useUI()
  const [progress, setProgress] = useState(null)
  const [year, setYear] = useState('all')
  const [dragging, setDragging] = useState(false)

  const sorted = useMemo(
    () => [...photos.items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [photos.items],
  )
  const years = useMemo(() => [...new Set(sorted.map((p) => p.date?.slice(0, 4)).filter(Boolean))], [sorted])
  const list = year === 'all' ? sorted : sorted.filter((p) => p.date?.startsWith(year))

  const upload = useCallback(
    async (files) => {
      if (!files?.length || progress) return
      const saved = await photos.upload(files, {}, (done, total) => setProgress({ done, total }))
      setProgress(null)
      if (saved.length) toast(saved.length === 1 ? 'Foto revelada 📸' : `${saved.length} fotos reveladas 📸`)
    },
    [photos, progress, toast],
  )

  // Arrastar fotos para qualquer lugar da página.
  useEffect(() => {
    const over = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
        setDragging(true)
      }
    }
    const leave = (e) => !e.relatedTarget && setDragging(false)
    const drop = (e) => {
      e.preventDefault()
      setDragging(false)
      upload(e.dataTransfer.files)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [upload])

  return (
    <section>
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <p className="font-hand text-2xl text-fuchsia-500">cada foto, uma lembrança</p>
        <h2 className="page-title">Nosso mural</h2>
        <p className="text-sm font-bold text-violet-400">{sorted.length === 1 ? '1 foto' : `${sorted.length} fotos`}</p>
        <label className={`btn mt-2 cursor-pointer px-6 py-3 ${progress ? 'pointer-events-none' : ''}`}>
          {progress ? (
            <><Spinner className="size-5" /> Revelando {progress.done} de {progress.total}…</>
          ) : (
            <><ImagePlus className="size-5" /> Adicionar fotos</>
          )}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </label>
        {progress && (
          <div className="h-2 w-64 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        )}
        <p className="hidden text-xs text-violet-400 sm:block">dica: dá pra arrastar várias fotos direto para a página</p>
      </header>

      {years.length > 1 && (
        <div className="no-scrollbar mb-8 flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
          {['all', ...years].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-extrabold transition ${
                year === y ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md' : 'bg-white/80 text-violet-500 hover:bg-white'
              }`}
            >
              {y === 'all' ? 'Todas' : y}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={Images} title="O mural está esperando vocês" text="Adicionem a primeira foto. Ela vira uma polaroid aqui." />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 px-1 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p, i) => (
            <div key={p.id} className="fade-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
              <Polaroid photo={p} onClick={() => openPhoto(p, list)} />
            </div>
          ))}
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-[2rem] border-4 border-dashed border-violet-400 bg-violet-100/80 backdrop-blur">
          <p className="flex items-center gap-3 font-display text-3xl font-bold text-violet-700">
            <ImagePlus className="size-8" /> Solta aqui 💜
          </p>
        </div>
      )}
    </section>
  )
}

/** Foto em tela cheia, com setas, legenda e data editáveis. */
export function Lightbox({ photo, list, onClose, onNavigate, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ caption: photo.caption ?? '', date: photo.date ?? '' })
  const [lastId, setLastId] = useState(photo.id)
  if (photo.id !== lastId) {
    setLastId(photo.id)
    setForm({ caption: photo.caption ?? '', date: photo.date ?? '' })
    setEditing(false)
  }

  const index = list.findIndex((p) => p.id === photo.id)
  const go = useCallback(
    (delta) => {
      if (list.length < 2) return
      onNavigate(list[(index + delta + list.length) % list.length])
    },
    [index, list, onNavigate],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (editing) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [go, onClose, editing])

  // Deslizar com o dedo no celular.
  const [touchX, setTouchX] = useState(null)

  const download = async () => {
    const res = await fetch(photo.url)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(await res.blob())
    a.download = `${photo.caption || 'nossa-foto'}.jpg`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-violet-950/90 backdrop-blur-md"
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return
        const dx = e.changedTouches[0].clientX - touchX
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        setTouchX(null)
      }}
    >
      <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-bold text-white/60">{list.length > 1 && `${index + 1} / ${list.length}`}</span>
        <div className="flex gap-1">
          <button className="btn-icon text-white hover:bg-white/10" onClick={() => setEditing((v) => !v)} aria-label="Editar">
            <Pencil className="size-5" />
          </button>
          <button className="btn-icon text-white hover:bg-white/10" onClick={download} aria-label="Baixar">
            <Download className="size-5" />
          </button>
          <button className="btn-icon text-white hover:bg-white/10" onClick={() => onDelete(photo)} aria-label="Apagar">
            <Trash2 className="size-5" />
          </button>
          <button className="btn-icon text-white hover:bg-white/10" onClick={onClose} aria-label="Fechar">
            <X className="size-6" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6">
        {list.length > 1 && (
          <button
            className="absolute left-2 z-10 hidden size-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex"
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            aria-label="Anterior"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <div key={photo.id} className="pop-in w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <Polaroid photo={{ ...photo, ...form }} size="lg" straight className="mx-auto" />
          {editing && (
            <form
              className="pop-in mx-auto mt-4 max-w-md space-y-3 rounded-3xl bg-white p-4"
              onSubmit={async (e) => {
                e.preventDefault()
                await onSave({ ...photo, ...form })
                setEditing(false)
              }}
            >
              <input className="input font-hand text-2xl" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Escreva uma legenda…" autoFocus />
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <button className="btn w-full"><Check className="size-4" /> Salvar</button>
            </form>
          )}
        </div>

        {list.length > 1 && (
          <button
            className="absolute right-2 z-10 hidden size-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex"
            onClick={(e) => { e.stopPropagation(); go(1) }}
            aria-label="Próxima"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>
  )
}
