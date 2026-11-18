import { Database } from 'lucide-react'
import { Background, Monogram } from './Decor'

const VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_COUPLE_EMAIL']

/** Aparece quando o arquivo .env ainda não foi configurado. */
export default function SetupNeeded() {
  const env = import.meta.env
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Background />
      <div className="card fade-in w-full max-w-lg p-8">
        <div className="flex items-center gap-3">
          <Monogram />
          <h1 className="font-display text-2xl font-bold">Falta ligar o banco de dados</h1>
        </div>
        <p className="mt-4 text-violet-700">
          O site guarda tudo no Supabase. Crie o arquivo <code className="rounded bg-violet-100 px-1.5">.env</code> na
          pasta do projeto seguindo o <b>README</b> e rode <code className="rounded bg-violet-100 px-1.5">npm run dev</code> de novo.
        </p>
        <ul className="mt-5 space-y-2">
          {VARS.map((v) => {
            const ok = Boolean(env[v] || (v === 'VITE_SUPABASE_PUBLISHABLE_KEY' && env.VITE_SUPABASE_ANON_KEY))
            return (
              <li key={v} className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 font-mono text-sm">
                <Database className="size-4 text-violet-400" />
                <span className="flex-1">{v}</span>
                <span className={ok ? 'text-emerald-600' : 'text-rose-500'}>{ok ? 'ok' : 'faltando'}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
