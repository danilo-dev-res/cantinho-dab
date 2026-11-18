import { useMemo, useState } from 'react'
import { MessageCircleHeart, Pin, PinOff, Send, X } from 'lucide-react'
import { Avatar, EmptyState, Spinner } from './Decor'
import { useUI } from '../lib/ui'

const ME_KEY = 'cantinho:me'
const MAX = 500

// Cada pessoa tem a sua cor, igual no resto do site.
const PAPER = {
  a: 'bg-gradient-to-br from-violet-50 to-indigo-100 border-violet-200',
  b: 'bg-gradient-to-br from-fuchsia-50 to-pink-100 border-fuchsia-200',
}

const readMe = () => {
  try {
    const v = localStorage.getItem(ME_KEY)
    return v === 'a' || v === 'b' ? v : null
  } catch {
    return null
  }
}

/** "agora", "hoje às 14:32", "ontem às 09:10", "12/11 às 20:45" */
function when(iso) {
  if (!iso) return 'agora'
  const d = new Date(iso)
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((today - day) / 86400000)
  if (diff === 0) return `hoje às ${hm}`
  if (diff === 1) return `ontem às ${hm}`
  return `${d.getDate()}/${d.getMonth() + 1} às ${hm}`
}

// Um tiltzinho fixo por recado (calculado pelo id, para não "dançar" a cada render).
function tiltOf(id = '') {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 7
  return (h - 3) * 0.6
}

export default function Notes({ notes, settings }) {
  const { toast, confirm } = useUI()
  const [me, setMe] = useState(readMe)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const names = { a: settings.nameA, b: settings.nameB }

  const chooseMe = (who) => {
    setMe(who)
    try {
      localStorage.setItem(ME_KEY, who)
    } catch {
      /* sem problema: só não lembra na próxima vez */
    }
  }

  // Fixados primeiro; dentro de cada grupo, os mais novos em cima.
  const sorted = useMemo(
    () =>
      [...notes.items].sort(
        (x, y) => Number(Boolean(y.pinned)) - Number(Boolean(x.pinned)) || new Date(y.createdAt) - new Date(x.createdAt),
      ),
    [notes.items],
  )

  const send = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || !me) return
    setSaving(true)
    try {
      await notes.save({ text: clean.slice(0, MAX), who: me, pinned: false })
      setText('')
      toast('Recado enviado 💌')
    } catch {
      /* o aviso de erro já aparece pelo store */
    } finally {
      setSaving(false)
    }
  }

  const togglePin = (n) => notes.save({ ...n, pinned: !n.pinned }).catch(() => {})

  const remove = async (n) => {
    const ok = await confirm({
      title: 'Apagar este recado?',
      text: 'Ele some do celular dos dois.',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (ok) notes.remove(n.id).catch(() => {})
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <p className="font-hand text-2xl text-fuchsia-500">cantinho de escrever</p>
        <h2 className="page-title">Recadinhos</h2>
      </header>

      <form onSubmit={send} className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mb-0 mr-1">quem é você?</span>
          {['a', 'b'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => chooseMe(k)}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-extrabold transition ${
                me === k ? 'bg-white shadow-md ring-2 ring-violet-400' : 'bg-violet-50 text-violet-400 hover:bg-violet-100'
              }`}
            >
              <Avatar who={k} name={names[k]} size="xs" /> {names[k]}
            </button>
          ))}
        </div>

        <div>
          <textarea
            className="input min-h-28 resize-y"
            value={text}
            maxLength={MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder={me ? `Escreve um recadinho, ${names[me]}…` : 'Escolhe quem você é primeiro 💜'}
            disabled={!me}
          />
          <p className="mt-1 text-right text-[11px] font-bold text-violet-300">
            {text.length}/{MAX}
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn" disabled={saving || !me || !text.trim()}>
            {saving ? <Spinner className="size-4" /> : <Send className="size-4" />} Enviar recado
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          icon={MessageCircleHeart}
          title="Nenhum recado ainda"
          text="Escreve o primeiro: pode ser um bom dia, uma saudade ou uma ideia de date 💜"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {sorted.map((n) => {
            const who = n.who === 'b' ? 'b' : 'a'
            return (
              <li
                key={n.id}
                style={{ transform: `rotate(${tiltOf(n.id)}deg)` }}
                className={`group relative rounded-3xl border p-4 pt-5 text-violet-950 shadow-[0_12px_30px_-14px_rgba(109,40,217,0.45)] ${PAPER[who]}`}
              >
                {n.pinned && <span className="absolute -top-2 left-5 text-lg" aria-label="Fixado">📌</span>}

                <p className="whitespace-pre-wrap break-words font-hand text-2xl leading-snug">{n.text}</p>

                <footer className="mt-4 flex items-center gap-2 text-[11px] font-bold text-violet-400">
                  <Avatar who={who} name={names[who]} size="xs" />
                  <span className="min-w-0 flex-1 truncate">
                    {names[who]} · {when(n.createdAt)}
                  </span>
                  <button
                    onClick={() => togglePin(n)}
                    className="rounded-full p-1.5 text-violet-300 transition hover:bg-white hover:text-violet-600"
                    aria-label={n.pinned ? 'Desafixar' : 'Fixar no topo'}
                    title={n.pinned ? 'Desafixar' : 'Fixar no topo'}
                  >
                    {n.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  </button>
                  <button
                    onClick={() => remove(n)}
                    className="rounded-full p-1.5 text-violet-300 transition hover:bg-white hover:text-rose-500"
                    aria-label="Apagar recado"
                  >
                    <X className="size-3.5" />
                  </button>
                </footer>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
