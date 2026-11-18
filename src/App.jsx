import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, CalendarHeart, Camera, Heart, House, Lock } from 'lucide-react'
import Home from './components/Home'
import Calendar from './components/Calendar'
import Photos, { Lightbox } from './components/Photos'
import Weekly from './components/Weekly'
import Settings from './components/Settings'
import SpecialDay from './components/SpecialDay'
import LockScreen from './components/LockScreen'
import SetupNeeded from './components/SetupNeeded'
import { Background, Monogram, Spinner } from './components/Decor'
import { UIProvider, useUI } from './lib/ui'
import { isConfigured, lockSite, supabase } from './lib/supabase'
import { useCollection, usePhotos, useSettings } from './lib/store'
import { daysBetween, plural, specialToday, todayISO } from './lib/dates'

const TABS = [
  { id: 'home', label: 'Início', icon: House },
  { id: 'calendar', label: 'Calendário', icon: CalendarHeart },
  { id: 'photos', label: 'Fotos', icon: Camera },
  { id: 'week', label: 'Semana', icon: CalendarClock },
  { id: 'us', label: 'Nós', icon: Heart },
]

const DISMISS_KEY = 'cantinho:special-dismissed'

export default function App() {
  return <UIProvider>{isConfigured ? <Gate /> : <SetupNeeded />}</UIProvider>
}

/** Só mostra o site depois de entrar com a senha. */
function Gate() {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  if (!session) return <LockScreen />
  return <Site />
}

function Splash({ text = 'abrindo o nosso cantinho…' }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-violet-500">
      <Background />
      <Monogram size="lg" />
      <p className="flex items-center gap-2 font-hand text-2xl"><Spinner className="size-5" /> {text}</p>
    </div>
  )
}

function Site() {
  const { toast, confirm } = useUI()
  const [tab, setTab] = useState('home')
  const { settings, setSettings, loading } = useSettings()
  const events = useCollection('event')
  const schedule = useCollection('schedule')
  const photos = usePhotos()

  const today = todayISO()
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === today)
  const [preview, setPreview] = useState(false)
  const [viewer, setViewer] = useState(null) // { id, ids }

  const openPhoto = useCallback((photo, list) => setViewer({ id: photo.id, ids: (list ?? [photo]).map((p) => p.id) }), [])
  const go = (id) => {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading || events.loading || schedule.loading || photos.loading) return <Splash text="buscando nossas coisas…" />

  const years = settings.startDate ? Math.max(1, new Date().getFullYear() - Number(settings.startDate.slice(0, 4))) : 1
  const special = preview ? { type: 'anniversary', years } : specialToday(settings, events.items, today)
  const showSpecial = special && (preview || !dismissed)
  const together = settings.startDate ? daysBetween(settings.startDate, today) : null

  const viewerList = viewer ? viewer.ids.map((id) => photos.items.find((p) => p.id === id)).filter(Boolean) : []
  const viewerPhoto = viewer ? photos.items.find((p) => p.id === viewer.id) : null

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 sm:pb-16">
      <Background />

      {/* ---------- Barra do topo ---------- */}
      <header className="sticky top-0 z-30 -mx-4 mb-6 px-4 pt-3">
        <div className="card flex items-center gap-3 rounded-[1.5rem] px-3 py-2.5">
          <button onClick={() => go('home')} className="flex min-w-0 items-center gap-3 text-left">
            <Monogram size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-bold leading-tight">
                {settings.nameA} <span className="font-normal italic text-fuchsia-500">&</span> {settings.nameB}
              </span>
              {together !== null && together >= 0 && (
                <span className="block text-xs font-bold text-violet-400">juntos há {plural(together, 'dia', 'dias')} 💜</span>
              )}
            </span>
          </button>

          <nav className="ml-auto hidden gap-1 md:flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-extrabold transition ${
                  tab === id ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-300' : 'text-violet-500 hover:bg-violet-50'
                }`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </nav>

          <button className="btn-icon ml-auto md:ml-1" onClick={lockSite} title="Trancar o site" aria-label="Trancar">
            <Lock className="size-5" />
          </button>
        </div>
      </header>

      {showSpecial && (
        <SpecialDay
          special={special}
          settings={settings}
          photos={photos.items}
          events={events.items}
          openPhoto={openPhoto}
          onClose={() => {
            if (preview) return setPreview(false)
            sessionStorage.setItem(DISMISS_KEY, today)
            setDismissed(true)
          }}
        />
      )}

      <main key={tab} className="fade-in">
        {tab === 'home' && (
          <Home settings={settings} events={events.items} photos={photos.items} schedule={schedule.items} go={go} openPhoto={openPhoto} />
        )}
        {tab === 'calendar' && <Calendar events={events} photos={photos} settings={settings} />}
        {tab === 'photos' && <Photos photos={photos} openPhoto={openPhoto} />}
        {tab === 'week' && <Weekly schedule={schedule} settings={settings} />}
        {tab === 'us' && (
          <Settings
            settings={settings}
            setSettings={setSettings}
            events={events}
            photos={photos}
            schedule={schedule}
            onPreview={() => {
              setPreview(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </main>

      <footer className="mt-16 text-center font-hand text-xl text-violet-300">feito com 💜 para o DAB</footer>

      {/* ---------- Abas no celular ---------- */}
      <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md justify-between rounded-[1.75rem] border border-white/80 bg-white/85 p-1.5 shadow-[0_12px_40px_-10px_rgba(109,40,217,0.4)] backdrop-blur-xl md:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-[1.25rem] py-2 text-[11px] font-extrabold transition ${
              tab === id ? 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-300' : 'text-violet-400'
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </nav>

      {viewerPhoto && (
        <Lightbox
          photo={viewerPhoto}
          list={viewerList}
          onClose={() => setViewer(null)}
          onNavigate={(p) => setViewer((v) => ({ ...v, id: p.id }))}
          onSave={async (p) => {
            await photos.save(p)
            toast('Foto atualizada 💜')
          }}
          onDelete={async (p) => {
            const ok = await confirm({ title: 'Apagar esta foto?', text: 'Ela some do mural dos dois celulares.', confirmLabel: 'Apagar', danger: true })
            if (!ok) return
            setViewer(null)
            await photos.removePhoto(p)
            toast('Foto apagada')
          }}
        />
      )}
    </div>
  )
}
