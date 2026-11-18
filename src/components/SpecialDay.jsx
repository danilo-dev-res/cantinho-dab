import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Polaroid from './Polaroid'
import { daysBetween, formatLong, todayISO } from '../lib/dates'

const HEARTS = Array.from({ length: 20 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.7) % 7,
  duration: 6 + (i % 5),
  size: 14 + ((i * 7) % 24),
  char: ['💜', '💗', '✨', '🤍', '💞'][i % 5],
}))

export default function SpecialDay({ special, settings, photos, events, onClose, openPhoto }) {
  const today = todayISO()
  const names = `${settings.nameA} & ${settings.nameB}`

  // Na data especial, as fotos ligadas a ela; no nosso dia, todas.
  const [order] = useState(() => Math.random())
  const slides = useMemo(() => {
    let list = photos
    if (special.type === 'event' && special.event.photoIds?.length) {
      list = photos.filter((p) => special.event.photoIds.includes(p.id))
    }
    return [...list].sort((a, b) => ((a.id.charCodeAt(0) * order) % 1) - ((b.id.charCodeAt(0) * order) % 1))
  }, [photos, special, order])

  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3500)
    return () => clearInterval(t)
  }, [slides.length])

  const memories = useMemo(
    () =>
      events
        .filter((e) => e.kind === 'special' && e.date <= today && (e.note || e.photoIds?.length))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, today],
  )

  const together = settings.startDate ? daysBetween(settings.startDate, today) : null

  let title, subtitle
  if (special.type === 'anniversary') {
    title = special.years === 1 ? '1 ano de nós' : `${special.years} anos de nós`
    subtitle = `Feliz aniversário de namoro, ${names}!`
  } else if (special.type === 'monthiversary') {
    title = `${special.months} meses juntos`
    subtitle = `Feliz mêsversário, ${names}!`
  } else {
    title = `${special.event.emoji} ${special.event.title}`
    subtitle = special.event.note || `Um dia especial para ${names}.`
  }

  const current = slides[idx % (slides.length || 1)]

  return (
    <section className="fade-in relative mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-800 via-purple-600 to-fuchsia-500 p-6 text-white shadow-2xl shadow-violet-400/50 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {HEARTS.map((h, i) => (
          <span key={i} className="heart-float" style={{ left: `${h.left}%`, fontSize: h.size, animationDelay: `${h.delay}s`, animationDuration: `${h.duration}s` }}>
            {h.char}
          </span>
        ))}
        <span className="absolute -bottom-6 -right-4 select-none font-display text-[9rem] font-bold leading-none text-white/10 sm:text-[14rem]">DAB</span>
      </div>

      <button onClick={onClose} className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25" aria-label="Fechar">
        <X className="size-5" />
      </button>

      <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-hand text-2xl text-fuchsia-100">hoje é um dia especial pro DAB</p>
          <h2 className="mt-1 font-display text-5xl font-bold leading-tight sm:text-6xl">{title}</h2>
          <p className="mt-3 max-w-lg text-lg text-violet-100">{subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {together > 0 && <Stat value={together.toLocaleString('pt-BR')} label="dias juntos" />}
            <Stat value={photos.length} label={photos.length === 1 ? 'foto' : 'fotos'} />
            <Stat value={memories.length} label={memories.length === 1 ? 'memória' : 'memórias'} />
          </div>
        </div>

        <div className="flex min-h-72 items-center justify-center">
          {current ? (
            <div key={current.id} className="pop-in w-64 sm:w-72">
              <Polaroid photo={current} onClick={() => openPhoto(current, slides)} />
            </div>
          ) : (
            <p className="rounded-3xl bg-white/10 p-6 text-center text-violet-100">
              Adicionem fotos no mural para elas aparecerem aqui nos dias especiais 📸
            </p>
          )}
        </div>
      </div>

      {memories.length > 0 && (
        <div className="relative mt-10">
          <h3 className="mb-4 font-display text-2xl font-bold">Nossas memórias</h3>
          <div className="no-scrollbar -mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-3">
            {memories.map((m) => {
              const pic = photos.find((p) => m.photoIds?.includes(p.id))
              return (
                <article key={m.id} className="w-64 shrink-0 snap-start rounded-3xl bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur">
                  {pic?.thumbUrl && <img src={pic.thumbUrl} alt="" className="mb-3 aspect-video w-full rounded-2xl object-cover" />}
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-fuchsia-100">{formatLong(m.date)}</p>
                  <p className="font-extrabold">{m.emoji} {m.title}</p>
                  {m.note && <p className="mt-1 line-clamp-4 text-sm text-violet-50">{m.note}</p>}
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur">
      <p className="font-display text-3xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-violet-100">{label}</p>
    </div>
  )
}
