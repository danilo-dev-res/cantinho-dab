import { useMemo, useState } from 'react'
import { ArrowRight, CalendarClock, Gift, Heart, ImagePlus, Shuffle, Sparkles } from 'lucide-react'
import Polaroid from './Polaroid'
import { Avatar } from './Decor'
import {
  daysBetween, formatLong, onThisDay, plural, scheduleOn, todayISO, togetherParts, upcomingSpecials, withAnniversary,
} from '../lib/dates'

export default function Home({ settings, events, photos, schedule, go, openPhoto }) {
  const today = todayISO()
  const parts = togetherParts(settings.startDate, today)
  const latest = useMemo(
    () => [...photos].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 3),
    [photos],
  )
  const next = upcomingSpecials(withAnniversary(events, settings), today, 1)[0]
  const todayItems = scheduleOn(schedule, today)
  const memories = onThisDay(photos, today)

  return (
    <div className="space-y-6">
      {/* ---------- Destaque ---------- */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-500 p-6 text-white shadow-2xl shadow-violet-400/40 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="blob absolute -right-16 -top-16 size-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
          <div className="blob absolute -bottom-24 left-10 size-72 rounded-full bg-violet-300/30 blur-3xl [animation-delay:-9s]" />
          <span className="absolute -bottom-8 right-4 select-none font-display text-[8rem] font-bold leading-none text-white/[0.07] sm:text-[12rem]">
            DAB
          </span>
        </div>

        <div className="relative grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-hand text-2xl text-fuchsia-100">nosso cantinho</p>
            <h1 className="mt-1 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
              {settings.nameA} <span className="font-normal italic text-fuchsia-200">&</span> {settings.nameB}
            </h1>

            {parts ? (
              <>
                <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-violet-100">juntos há</p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {parts.years > 0 && <Counter value={parts.years} label={parts.years === 1 ? 'ano' : 'anos'} />}
                  <Counter value={parts.months} label={parts.months === 1 ? 'mês' : 'meses'} />
                  <Counter value={parts.days} label={parts.days === 1 ? 'dia' : 'dias'} />
                </div>
                <p className="mt-4 text-sm text-violet-100">
                  desde {formatLong(settings.startDate)} · {plural(parts.total, 'dia', 'dias')} de nós{' '}
                  <Heart className="heartbeat inline size-4 fill-fuchsia-200 text-fuchsia-200" />
                </p>
              </>
            ) : (
              <button onClick={() => go('us')} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-3 font-bold backdrop-blur transition hover:bg-white/30">
                <Heart className="size-4" /> Contar desde quando estamos juntos <ArrowRight className="size-4" />
              </button>
            )}
          </div>

          <div className="relative mx-auto h-64 w-full max-w-xs sm:h-72">
            {latest.length ? (
              latest.map((p, i) => (
                <div
                  key={p.id}
                  className="absolute left-1/2 top-1/2 w-40 sm:w-48"
                  style={{ transform: `translate(-50%, -50%) translateX(${(i - 1) * 56}px) rotate(${(i - 1) * 9}deg)`, zIndex: i === 1 ? 3 : 1 }}
                >
                  <Polaroid photo={p} size="md" straight onClick={() => openPhoto(p)} />
                </div>
              ))
            ) : (
              <button
                onClick={() => go('photos')}
                className="absolute inset-0 m-auto flex h-56 w-48 rotate-3 flex-col items-center justify-center gap-2 rounded bg-white/95 p-3 text-violet-500 shadow-2xl transition hover:rotate-0"
              >
                <ImagePlus className="size-8" />
                <span className="font-hand text-2xl">nossa primeira foto</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Cartões ---------- */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card title="Próxima data especial" icon={Gift} action="calendário" onAction={() => go('calendar')}>
          {next ? (
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-4xl">
                {next.emoji}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold">{next.title}</p>
                <p className="text-sm text-violet-500">{formatLong(next.next)}</p>
                <Countdown days={daysBetween(today, next.next)} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-violet-500">Marquem as datas de vocês no calendário 💜</p>
          )}
        </Card>

        <Card title="Hoje na nossa semana" icon={CalendarClock} action="semana" onAction={() => go('week')}>
          {todayItems.length ? (
            <ul className="space-y-2">
              {todayItems.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-violet-50/80 px-3 py-2">
                  <span className="rounded-xl bg-white px-2 py-1 text-xs font-extrabold text-violet-600 shadow-sm">{s.time}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.title}</span>
                  <Avatar who={s.who} name={s.who === 'b' ? settings.nameB : settings.nameA} size="xs" />
                </li>
              ))}
              {todayItems.length > 4 && <li className="text-xs text-violet-400">+ {todayItems.length - 4} coisas</li>}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-violet-500">
              <Sparkles className="size-4" /> Dia livre. Que tal um date?
            </p>
          )}
        </Card>

        <MemoryCard memories={memories} photos={photos} openPhoto={openPhoto} go={go} />
      </div>
    </div>
  )
}

function Counter({ value, label }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/15 px-4 py-2.5 text-center ring-1 ring-white/25 backdrop-blur">
      <p className="font-display text-4xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-violet-100">{label}</p>
    </div>
  )
}

function Countdown({ days }) {
  if (days === 0) return <p className="mt-1 inline-block rounded-full bg-fuchsia-500 px-3 py-0.5 text-xs font-extrabold text-white">é hoje! 🎉</p>
  return (
    <p className="mt-1 text-sm font-bold text-fuchsia-600">
      {days === 1 ? 'é amanhã!' : `faltam ${days} dias`}
    </p>
  )
}

function Card({ title, icon: Icon, action, onAction, children }) {
  return (
    <section className="card flex flex-col p-5">
      <header className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Icon className="size-4" />
        </span>
        <h3 className="flex-1 font-display text-lg font-bold">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-xs font-extrabold text-violet-500 hover:text-violet-700">
            {action} →
          </button>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}

function MemoryCard({ memories, photos, openPhoto, go }) {
  const pool = memories.length ? memories : photos
  const [seed, setSeed] = useState(() => Math.random())
  const photo = pool.length ? pool[Math.floor(seed * pool.length) % pool.length] : null
  const yearsAgo = photo && memories.length ? new Date().getFullYear() - Number(photo.date.slice(0, 4)) : 0

  return (
    <Card title={memories.length ? 'Neste dia…' : 'Uma lembrança'} icon={Heart} action={photos.length ? 'mural' : null} onAction={() => go('photos')}>
      {photo ? (
        <div className="flex items-center gap-4">
          <Polaroid photo={photo} size="sm" onClick={() => openPhoto(photo)} />
          <div className="min-w-0 flex-1">
            {memories.length > 0 && (
              <p className="text-xs font-extrabold uppercase tracking-wider text-fuchsia-500">
                há {plural(yearsAgo, 'ano', 'anos')}
              </p>
            )}
            <p className="font-hand text-2xl leading-tight text-violet-900">{photo.caption || 'nós 💜'}</p>
            {photo.date && <p className="text-xs text-violet-400">{formatLong(photo.date)}</p>}
            {pool.length > 1 && (
              <button onClick={() => setSeed(Math.random())} className="btn-ghost -ml-3 mt-1 text-sm">
                <Shuffle className="size-4" /> outra
              </button>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => go('photos')} className="btn-soft w-full">
          <ImagePlus className="size-4" /> Adicionar fotos
        </button>
      )}
    </Card>
  )
}
