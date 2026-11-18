import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, Repeat, X } from 'lucide-react'
import { Avatar, Spinner } from './Decor'
import { RepeatPicker } from './Calendar'
import { MONTHS, REPEAT_SHORT, formatLong, parseISO, scheduleOn, thisWeekDates, todayISO, weekdayIndex } from '../lib/dates'
import { useUI } from '../lib/ui'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const SUGGESTIONS = [
  '✂️ Cortar o cabelo', '🇬🇧 Aula de inglês', '🍷 Date night', '💪 Academia',
  '🎬 Cinema', '🛒 Mercado', '📞 Ligar pra família', '🍝 Jantar juntos', '📚 Estudar', '🧺 Faxina',
]

const WEEK_REPEAT_OPTIONS = [
  ['weekly', 'Toda semana'],
  ['monthly', 'Todo mês'],
  ['yearly', 'Todo ano'],
  ['once', 'Só uma vez'],
]

const STYLE = {
  a: 'border-violet-400 bg-violet-50',
  b: 'border-fuchsia-400 bg-fuchsia-50',
  both: 'border-purple-400 bg-gradient-to-r from-violet-50 to-fuchsia-50',
}

export default function Weekly({ schedule, settings }) {
  const { toast, confirm } = useUI()
  const todayIso = todayISO()
  const [offset, setOffset] = useState(0)
  const dates = thisWeekDates(new Date(), offset)
  const people = [
    ['a', settings.nameA],
    ['b', settings.nameB],
    ['both', 'Nós dois'],
  ]
  const [form, setForm] = useState({ repeat: 'weekly', day: weekdayIndex(), date: todayIso, time: '19:00', title: '', who: 'both' })
  const [saving, setSaving] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const { repeat, day, date, time, who } = form
      const item = { title: form.title.trim(), time, who, repeat }
      // "Toda semana" guarda o dia da semana; as outras opções guardam a data.
      if (repeat === 'weekly') item.day = day
      else item.date = date
      await schedule.save(item)
      toast(
        repeat === 'weekly' ? `Anotado: toda ${DAYS[day].toLowerCase()} 💜`
          : repeat === 'monthly' ? `Anotado: todo dia ${parseISO(date).getDate()} 💜`
            : repeat === 'yearly' ? `Anotado: todo ${formatLong(date).replace(/ de \d{4}$/, '')} 💜`
              : `Anotado para ${formatLong(date)} 💜`,
      )
      setForm({ ...form, title: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-8">
      <header className="text-center">
        <p className="font-hand text-2xl text-fuchsia-500">pra gente se organizar junto</p>
        <h2 className="page-title">Nossa semana</h2>
      </header>

      <form onSubmit={add} className="card mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que vai rolar? Ex.: Aula de inglês" />
          {form.repeat === 'weekly' ? (
            <select className="input" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          ) : (
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          )}
          <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
        </div>

        <RepeatPicker value={form.repeat} onChange={(repeat) => setForm({ ...form, repeat })} options={WEEK_REPEAT_OPTIONS} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="label mb-0 mr-1">de quem?</span>
          {people.map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setForm({ ...form, who: k })}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-extrabold transition ${
                form.who === k ? 'bg-white shadow-md ring-2 ring-violet-400' : 'bg-violet-50 text-violet-400 hover:bg-violet-100'
              }`}
            >
              <Avatar who={k} name={label} size="xs" /> {label}
            </button>
          ))}
          <button type="submit" className="btn ml-auto" disabled={saving || !form.title.trim()}>
            {saving ? <Spinner className="size-4" /> : <Plus className="size-4" />} Adicionar
          </button>
        </div>

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto border-t border-violet-100 px-1 pt-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, title: s })}
              className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      <div className="flex items-center justify-center gap-3">
        <button className="btn-icon" onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={() => setOffset(0)} className="min-w-52 text-center" title="Voltar para esta semana">
          <p className="font-display text-xl font-bold">{weekTitle(offset)}</p>
          <p className="text-xs font-bold text-violet-400">{weekRange(dates)}</p>
        </button>
        <button className="btn-icon" onClick={() => setOffset((o) => o + 1)} aria-label="Próxima semana">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 lg:gap-3">
        {DAYS.map((day, i) => {
          const items = scheduleOn(schedule.items, dates[i])
          const isToday = dates[i] === todayIso
          const date = parseISO(dates[i])
          return (
            <div
              key={day}
              className={`card flex flex-col rounded-[1.5rem] p-3 lg:min-h-80 ${
                isToday ? 'ring-2 ring-violet-500 shadow-violet-300/60' : ''
              }`}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <h3 className="font-display text-lg font-bold">
                  <span className="lg:hidden">{day}</span>
                  <span className="hidden lg:inline">{day.slice(0, 3)}</span>
                </h3>
                {isToday ? (
                  <span className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 text-[11px] font-extrabold text-white">hoje</span>
                ) : (
                  <span className="text-xs font-extrabold text-violet-300">{`${date.getDate()}/${date.getMonth() + 1}`}</span>
                )}
              </header>
              <ul className="space-y-2">
                {items.map((s) => {
                  const name = s.who === 'a' ? settings.nameA : s.who === 'b' ? settings.nameB : 'Nós dois'
                  return (
                    <li key={s.id} className={`group relative rounded-2xl border-l-4 p-2.5 pr-7 text-violet-950 shadow-sm ${STYLE[s.who] ?? STYLE.both}`}>
                      <p className="flex items-center gap-1 text-[11px] font-extrabold text-violet-500">
                        <Clock className="size-3" /> {s.time}
                        {s.repeat && s.repeat !== 'weekly' && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-white/80 px-1.5 text-[10px] text-fuchsia-600">
                            {s.repeat === 'once' ? 'só hoje' : <><Repeat className="size-2.5" /> {REPEAT_SHORT[s.repeat]}</>}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-snug">{s.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-violet-400">
                        <Avatar who={s.who} name={name} size="xs" /> {name}
                      </p>
                      <button
                        onClick={async () => {
                          const ok = s.repeat === 'once' || !s.repeat || s.repeat === 'weekly'
                            ? true
                            : await confirm({ title: 'Remover?', text: `"${s.title}" se repete ${REPEAT_SHORT[s.repeat]}. Remover vai tirar de todas as datas.`, confirmLabel: 'Remover', danger: true })
                          if (ok) schedule.remove(s.id)
                        }}
                        className="absolute right-1.5 top-1.5 rounded-full p-1 text-violet-300 transition hover:bg-white hover:text-rose-500"
                        aria-label="Remover"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  )
                })}
                {items.length === 0 && (
                  <li className="px-1 text-xs font-bold text-violet-300">livre ✨</li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function weekTitle(offset) {
  if (offset === 0) return 'Esta semana'
  if (offset === 1) return 'Próxima semana'
  if (offset === -1) return 'Semana passada'
  return offset > 0 ? `Daqui ${offset} semanas` : `${-offset} semanas atrás`
}

function weekRange(dates) {
  const a = parseISO(dates[0])
  const b = parseISO(dates[6])
  const m = (d) => MONTHS[d.getMonth()].slice(0, 3).toLowerCase()
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} a ${b.getDate()} de ${m(b)}`
    : `${a.getDate()} de ${m(a)} a ${b.getDate()} de ${m(b)}`
}
