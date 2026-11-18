import { useState } from 'react'
import { CloudUpload, Eye, Heart, KeyRound, Lock, Check, Database } from 'lucide-react'
import { Avatar, Spinner } from './Decor'
import { Toggle } from './Calendar'
import { changePin, lockSite, rememberPinLength } from '../lib/supabase'
import { hasLocalData, migrateLocal } from '../lib/store'
import { formatLong, plural, togetherParts } from '../lib/dates'
import { useUI } from '../lib/ui'

export default function Settings({ settings, setSettings, events, photos, schedule, onPreview }) {
  const parts = togetherParts(settings.startDate)
  const specials = events.items.filter((e) => e.kind === 'special').length
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="text-center">
        <p className="font-hand text-2xl text-fuchsia-500">tudo sobre</p>
        <h2 className="page-title">Nós dois</h2>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={parts ? parts.total.toLocaleString('pt-BR') : '—'} label="dias juntos" />
        <Stat value={photos.items.length} label="fotos" />
        <Stat value={specials} label="datas especiais" />
      </div>

      <AboutForm settings={settings} setSettings={setSettings} onPreview={onPreview} />
      <PinForm />
      <DataCard settings={settings} setSettings={setSettings} events={events} photos={photos} schedule={schedule} />
    </section>
  )
}

function Stat({ value, label }) {
  return (
    <div className="card px-3 py-4 text-center">
      <p className="text-gradient font-display text-3xl font-bold">{value}</p>
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-400">{label}</p>
    </div>
  )
}

function Section({ icon: Icon, title, children, action }) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-300/50">
          <Icon className="size-5" />
        </span>
        <h3 className="flex-1 font-display text-xl font-bold">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  )
}

function AboutForm({ settings, setSettings, onPreview }) {
  const { toast } = useUI()
  const [form, setForm] = useState({
    nameA: settings.nameA, nameB: settings.nameB, startDate: settings.startDate, monthiversary: settings.monthiversary,
  })
  const [saving, setSaving] = useState(false)
  const dirty = ['nameA', 'nameB', 'startDate', 'monthiversary'].some((k) => form[k] !== settings[k])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setSettings(form)
      toast('Salvo nos dois celulares 💜')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={Heart} title="O casal">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['nameA', 'a'],
            ['nameB', 'b'],
          ].map(([key, who]) => (
            <label key={key} className="flex items-center gap-3 rounded-3xl bg-violet-50/70 p-3">
              <Avatar who={who} name={form[key]} size="md" />
              <span className="flex-1">
                <span className="label mb-0.5">{who === 'a' ? 'você' : 'ela'}</span>
                <input className="w-full bg-transparent font-display text-xl font-bold outline-none" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </span>
            </label>
          ))}
        </div>
        <label className="block">
          <span className="label">Dia em que começamos a namorar</span>
          <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          {form.startDate && <span className="mt-1.5 block text-xs font-semibold text-violet-500">💞 {formatLong(form.startDate)}: todo ano nesse dia aparece a surpresa.</span>}
        </label>
        <Toggle checked={form.monthiversary} onChange={(v) => setForm({ ...form, monthiversary: v })} label="Mostrar a surpresa também todo mês (mêsversário)" />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn flex-1" disabled={!dirty || saving}>
            {saving ? <Spinner className="size-4" /> : <Check className="size-4" />} Salvar
          </button>
          <button type="button" className="btn-soft" onClick={onPreview}>
            <Eye className="size-4" /> Ver a surpresa
          </button>
        </div>
      </form>
    </Section>
  )
}

function PinForm() {
  const { toast } = useUI()
  const empty = { current: '', next: '', confirm: '' }
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const onlyDigits = (v) => v.replace(/\D/g, '').slice(0, 8)

  const submit = async (e) => {
    e.preventDefault()
    if (form.next.length < 4) return setError('A nova senha precisa ter de 4 a 8 números.')
    if (form.next !== form.confirm) return setError('A confirmação está diferente da nova senha.')
    setBusy(true)
    const res = await changePin(form.current, form.next)
    setBusy(false)
    if (!res.ok) {
      return setError(
        res.reason === 'current' ? 'A senha atual não confere.'
          : res.reason === 'rate' ? 'Muitas tentativas. Espere um pouco e tente de novo.'
            : `Não consegui trocar: ${res.message}`,
      )
    }
    rememberPinLength(form.next.length)
    setForm(empty)
    toast('Senha trocada! Vale para os dois celulares 🔐')
  }

  const field = (key, label) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        className="input text-center text-lg tracking-[0.5em]"
        value={form[key]}
        onChange={(e) => {
          setError('')
          setForm({ ...form, [key]: onlyDigits(e.target.value) })
        }}
        placeholder="••••"
      />
    </label>
  )

  return (
    <Section
      icon={KeyRound}
      title="Senha do site"
      action={
        <button type="button" className="btn-ghost text-sm" onClick={lockSite}>
          <Lock className="size-4" /> Trancar
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {field('current', 'Senha atual')}
          {field('next', 'Nova senha')}
          {field('confirm', 'Repetir a nova')}
        </div>
        {error && <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600">{error}</p>}
        <button type="submit" className="btn w-full" disabled={busy || !form.current || !form.next}>
          {busy ? <Spinner className="size-4" /> : <KeyRound className="size-4" />} Trocar senha
        </button>
      </form>
    </Section>
  )
}

function DataCard({ settings, setSettings, events, photos, schedule }) {
  const { toast, confirm } = useUI()
  const [hasLocal, setHasLocal] = useState(hasLocalData)
  const [progress, setProgress] = useState(null)

  const migrate = async () => {
    const ok = await confirm({
      title: 'Trazer as coisas antigas?',
      text: 'As fotos, datas e a semana que ficaram salvas só neste navegador vão para o banco de dados.',
      confirmLabel: 'Enviar',
    })
    if (!ok) return
    try {
      const total = await migrateLocal({ photos, events, schedule, settings, setSettings }, (d, t) => setProgress(`${d} de ${t}`))
      toast(`${plural(total, 'item enviado', 'itens enviados')} 💜`)
      setHasLocal(false)
    } catch (e) {
      toast('Parou no meio: ' + e.message, 'error')
    } finally {
      setProgress(null)
    }
  }

  return (
    <Section icon={Database} title="Onde fica tudo">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
        Conectado ao banco de dados. O que um muda, o outro vê na hora.
      </div>
      <p className="mt-3 text-sm text-violet-500">
        {plural(photos.items.length, 'foto', 'fotos')} · {plural(events.items.length, 'data', 'datas')} no calendário ·{' '}
        {plural(schedule.items.length, 'compromisso', 'compromissos')} na semana
      </p>
      {hasLocal && (
        <button className="btn mt-4 w-full" onClick={migrate} disabled={Boolean(progress)}>
          {progress ? <><Spinner className="size-4" /> Enviando {progress}</> : <><CloudUpload className="size-4" /> Enviar o que estava salvo neste navegador</>}
        </button>
      )}
    </Section>
  )
}
