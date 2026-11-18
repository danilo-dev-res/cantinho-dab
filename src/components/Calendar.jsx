import { useMemo, useState } from 'react'
import { CalendarHeart, Check, ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import Polaroid from './Polaroid'
import { Spinner } from './Decor'
import { useUI } from '../lib/ui'
import {
  MONTHS, WEEKDAYS_SHORT, daysBetween, formatLong, monthGrid, occursOn, todayISO, upcomingSpecials, withAnniversary,
} from '../lib/dates'

const EMOJIS = ['💜', '💞', '💍', '🎂', '🌹', '✈️', '🍷', '🎬', '🎉', '🏖️', '🍕', '🎵', '⭐', '📚', '💇', '🩺', '🐶', '🎁', '🏠', '🎮']

const emptyEvent = (date) => ({ title: '', date, emoji: '💜', kind: 'special', yearly: true, note: '', photoIds: [] })

export default function Calendar({ events, photos, settings }) {
  const { confirm, toast } = useUI()
  const today = todayISO()
  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selectedDay, setSelectedDay] = useState(null)
  const [editing, setEditing] = useState(null)

  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor])
  const allEvents = useMemo(() => withAnniversary(events.items, settings), [events.items, settings])
  const eventsOn = (iso) => allEvents.filter((e) => occursOn(e, iso))
  const upcoming = upcomingSpecials(allEvents, today, 6)

  const move = (delta) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card p-3 sm:p-6">
        <header className="mb-5 flex items-center justify-between gap-2 px-1">
          <button className="btn-icon" onClick={() => move(-1)} aria-label="Mês anterior">
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="text-center"
            onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}
            title="Voltar para hoje"
          >
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-gradient">{MONTHS[cursor.m]}</span>
            </h2>
            <p className="text-sm font-extrabold tracking-[0.3em] text-violet-300">{cursor.y}</p>
          </button>
          <button className="btn-icon" onClick={() => move(1)} aria-label="Próximo mês">
            <ChevronRight className="size-5" />
          </button>
        </header>

        <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-extrabold uppercase tracking-wider text-violet-400">
          {WEEKDAYS_SHORT.map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {grid.map((cell) => {
            const evs = eventsOn(cell.iso)
            const isToday = cell.iso === today
            const special = evs.some((e) => e.kind === 'special')
            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedDay(cell.iso)}
                className={`relative flex min-h-14 flex-col rounded-2xl p-1 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-24 sm:p-2 ${
                  !cell.inMonth
                    ? 'text-violet-300 opacity-60'
                    : special
                      ? 'bg-gradient-to-br from-fuchsia-100 via-violet-100 to-purple-100'
                      : 'bg-white/80'
                } ${isToday ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white/0' : 'ring-1 ring-violet-100/80'}`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-extrabold sm:size-7 sm:text-sm ${
                    isToday ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md' : ''
                  }`}
                >
                  {cell.day}
                </span>
                {special && <span className="absolute right-1 top-1 text-[10px] sm:right-2 sm:top-2 sm:text-xs">💜</span>}
                <span className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                  {evs.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`truncate rounded-lg px-1 py-px text-[10px] font-bold sm:px-1.5 sm:text-xs ${
                        e.kind === 'special' ? 'bg-white/70 text-fuchsia-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {e.emoji}
                      <span className="hidden sm:inline"> {e.title}</span>
                    </span>
                  ))}
                  {evs.length > 2 && <span className="px-1 text-[10px] font-bold text-violet-400">+{evs.length - 2}</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-violet-500">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-gradient-to-br from-fuchsia-200 to-violet-200" /> data especial</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-violet-100" /> compromisso</span>
        </div>
      </section>

      <aside className="space-y-4">
        <button className="btn w-full py-3.5" onClick={() => setEditing(emptyEvent(today))}>
          <Plus className="size-5" /> Nova data
        </button>
        <div className="card p-5">
          <h3 className="mb-3 font-display text-xl font-bold">Próximas datas especiais</h3>
          {upcoming.length === 0 && (
            <p className="text-sm text-violet-500">Toque em um dia do calendário para marcar a primeira data especial de vocês 💜</p>
          )}
          <ul className="-mx-2 space-y-1">
            {upcoming.map((e) => {
              const days = daysBetween(today, e.next)
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setSelectedDay(e.next)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-violet-50"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-2xl">
                      {e.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold">{e.title}</span>
                      <span className="block text-xs text-violet-500">{formatLong(e.next)}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                        days === 0 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white' : 'bg-fuchsia-100 text-fuchsia-700'
                      }`}
                    >
                      {days === 0 ? 'hoje!' : days === 1 ? 'amanhã' : `${days} dias`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <DayModal
        iso={selectedDay}
        events={selectedDay ? eventsOn(selectedDay) : []}
        photos={photos.items}
        onClose={() => setSelectedDay(null)}
        onAdd={() => setEditing(emptyEvent(selectedDay))}
        onEdit={setEditing}
      />

      {editing && (
        <EventForm
          initial={editing}
          photos={photos}
          onClose={() => setEditing(null)}
          onSave={async (ev) => {
            await events.save(ev)
            toast(ev.id ? 'Data atualizada 💜' : 'Data marcada 💜')
            setEditing(null)
          }}
          onDelete={async (ev) => {
            const ok = await confirm({ title: 'Apagar esta data?', text: `"${ev.title}" vai sumir do calendário dos dois.`, confirmLabel: 'Apagar', danger: true })
            if (!ok) return
            await events.remove(ev.id)
            toast('Data apagada')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function DayModal({ iso, events, photos, onClose, onAdd, onEdit }) {
  return (
    <Modal open={Boolean(iso)} onClose={onClose} title={iso ? formatLong(iso) : ''} icon={CalendarHeart}>
      {events.length === 0 ? (
        <p className="rounded-2xl bg-violet-50 p-5 text-center text-violet-500">Nada marcado neste dia ainda.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const pics = photos.filter((p) => e.photoIds?.includes(p.id))
            return (
              <li key={e.id} className={`rounded-3xl p-4 ${e.kind === 'special' ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50' : 'bg-violet-50'}`}>
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-violet-950">{e.title}</p>
                    <p className="text-xs font-bold text-violet-400">
                      {e.kind === 'special' ? 'data especial' : 'compromisso'}
                      {e.yearly ? ' · todo ano' : ''}
                    </p>
                    {e.note && <p className="mt-2 whitespace-pre-line text-sm text-violet-800">{e.note}</p>}
                  </div>
                  {!e.auto && (
                    <button className="btn-icon size-9" onClick={() => onEdit(e)} aria-label="Editar">
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
                {pics.length > 0 && (
                  <div className="no-scrollbar -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
                    {pics.map((p) => <Polaroid key={p.id} photo={p} size="sm" />)}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <button className="btn mt-5 w-full" onClick={onAdd}>
        <Plus className="size-4" /> Marcar algo neste dia
      </button>
    </Modal>
  )
}

function EventForm({ initial, photos, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial)
  const [progress, setProgress] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const togglePhoto = (id) =>
    set({ photoIds: form.photoIds.includes(id) ? form.photoIds.filter((x) => x !== id) : [...form.photoIds, id] })

  async function upload(files) {
    const saved = await photos.upload(files, { caption: form.title, date: form.date }, (d, t) => setProgress(t ? `${d}/${t}` : null))
    setProgress(null)
    setForm((f) => ({ ...f, photoIds: [...f.photoIds, ...saved.map((p) => p.id)] }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({ ...form, title: form.title.trim() })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={form.id ? 'Editar data' : 'Nova data'} icon={CalendarHeart}>
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-violet-100/70 p-1">
          {[
            ['special', '💜 Data especial'],
            ['appointment', '📌 Compromisso'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ kind: k, yearly: k === 'special' })}
              className={`rounded-xl py-2.5 text-sm font-extrabold transition ${form.kind === k ? 'bg-white text-violet-800 shadow-md' : 'text-violet-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="label">O que é?</span>
          <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Nosso primeiro beijo" autoFocus required />
        </label>

        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <label className="block">
            <span className="label">Data</span>
            <input type="date" className="input" value={form.date} onChange={(e) => set({ date: e.target.value })} required />
          </label>
          <Toggle checked={form.yearly} onChange={(v) => set({ yearly: v })} label="Todo ano" />
        </div>

        <div>
          <span className="label">Emoji</span>
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => set({ emoji: em })}
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl transition ${
                  form.emoji === em ? 'scale-110 bg-gradient-to-br from-violet-200 to-fuchsia-200 shadow-md' : 'bg-violet-50 hover:bg-violet-100'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="label">Memória / anotação</span>
          <textarea className="input min-h-24 resize-y" value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Como foi esse dia? O que vocês querem lembrar?" />
        </label>

        {form.kind === 'special' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="label mb-0">Fotos desta data</span>
              <label className={`btn-soft cursor-pointer px-3 py-1.5 text-sm ${progress ? 'pointer-events-none opacity-70' : ''}`}>
                {progress ? <><Spinner className="size-4" /> {progress}</> : <><ImagePlus className="size-4" /> Enviar</>}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
              </label>
            </div>
            {photos.items.length === 0 ? (
              <p className="rounded-2xl bg-violet-50 p-3 text-sm text-violet-500">As fotos enviadas aqui também vão para o mural.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-violet-400">Toque nas fotos do mural para ligar a esta data:</p>
                <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto rounded-2xl bg-violet-50/60 p-2 sm:grid-cols-5">
                  {[...photos.items].reverse().map((p) => {
                    const on = form.photoIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePhoto(p.id)}
                        className={`relative overflow-hidden rounded-xl ring-2 transition ${on ? 'ring-fuchsia-500' : 'ring-transparent opacity-60 hover:opacity-100'}`}
                      >
                        {p.thumbUrl ? <img src={p.thumbUrl} alt="" className="aspect-square w-full object-cover" /> : <div className="shimmer aspect-square" />}
                        {on && (
                          <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-fuchsia-500 text-white">
                            <Check className="size-3" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {form.id && (
            <button type="button" className="btn-soft text-rose-600" onClick={() => onDelete(form)} aria-label="Apagar">
              <Trash2 className="size-4" />
            </button>
          )}
          <button type="submit" className="btn flex-1" disabled={saving || Boolean(progress)}>
            {saving ? <Spinner className="size-4" /> : <Check className="size-4" />} Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 pb-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500' : 'bg-violet-200'}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
      <span className="text-sm font-bold text-violet-800">{label}</span>
    </label>
  )
}
