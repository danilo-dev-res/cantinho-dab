import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Delete } from 'lucide-react'
import { PIN_LENGTH_KEY, signInWithPin } from '../lib/supabase'
import { cachedNames } from '../lib/store'
import { Monogram, Spinner } from './Decor'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'ok', '0', 'del']

const SPARKLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 41) % 100,
  delay: (i * 0.9) % 8,
  duration: 8 + (i % 6),
  size: 12 + ((i * 5) % 18),
  char: ['💜', '✨', '🤍', '💗'][i % 4],
}))

export default function LockScreen() {
  const { nameA, nameB } = cachedNames()
  const expected = Number(localStorage.getItem(PIN_LENGTH_KEY)) || 4
  const [pin, setPin] = useState('')
  const [state, setState] = useState('idle') // idle | checking | wrong | error | rate
  const [hint, setHint] = useState('')

  const submit = useCallback(async (value) => {
    if (value.length < 4) return
    setState('checking')
    const error = await signInWithPin(value)
    if (!error) {
      localStorage.setItem(PIN_LENGTH_KEY, String(value.length))
      return // o App percebe o login e abre o site
    }
    if (error.status === 429) setState('rate')
    else if (error.status === 400 || /invalid/i.test(error.message)) setState('wrong')
    else {
      setState('error')
      setHint(error.message)
    }
    setTimeout(() => setPin(''), 450)
  }, [])

  const press = useCallback(
    (key) => {
      if (state === 'checking') return
      if (state !== 'idle') setState('idle')
      if (key === 'del') return setPin((p) => p.slice(0, -1))
      if (key === 'ok') return submit(pin)
      if (pin.length >= 8) return
      const next = pin + key
      setPin(next)
      if (next.length === expected) submit(next)
    },
    [state, pin, expected, submit],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('del')
      else if (e.key === 'Enter') press('ok')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const message = {
    idle: 'digite a nossa senha',
    checking: 'abrindo o nosso cantinho…',
    wrong: 'senha errada 💔',
    rate: 'muitas tentativas, espere um pouquinho',
    error: 'sem conexão com o banco de dados',
  }[state]

  const dots = Math.max(expected, pin.length)
  const bad = state === 'wrong' || state === 'rate' || state === 'error'

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-violet-900 via-purple-700 to-fuchsia-600 p-6 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-20 top-10 size-80 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="blob absolute -right-20 bottom-10 size-96 rounded-full bg-violet-400/30 blur-3xl [animation-delay:-8s]" />
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="heart-float"
            style={{ left: `${s.left}%`, fontSize: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
          >
            {s.char}
          </span>
        ))}
        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 select-none font-display text-[11rem] font-bold leading-none text-white/[0.06] sm:text-[18rem]">
          DAB
        </span>
      </div>

      <div className="fade-in relative w-full max-w-xs text-center">
        <Monogram size="lg" light />
        <h1 className="mt-5 font-display text-4xl font-bold">
          {nameA} <span className="font-normal italic text-fuchsia-200">&</span> {nameB}
        </h1>
        <p className={`mt-2 font-hand text-2xl transition ${bad ? 'text-rose-200' : 'text-fuchsia-100'}`}>{message}</p>

        <div className={`my-8 flex h-5 items-center justify-center gap-4 ${state === 'wrong' ? 'shake' : ''}`}>
          {state === 'checking' ? (
            <Spinner className="size-6 text-white" />
          ) : (
            Array.from({ length: dots }, (_, i) => (
              <span
                key={i}
                className={`size-4 rounded-full border-2 transition-all duration-200 ${
                  bad
                    ? 'border-rose-300 bg-rose-300'
                    : i < pin.length
                      ? 'scale-110 border-white bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]'
                      : 'border-white/50'
                }`}
              />
            ))
          )}
        </div>

        <div className="grid grid-cols-3 gap-x-5 gap-y-4">
          {KEYS.map((k) => {
            const special = k === 'ok' || k === 'del'
            return (
              <button
                key={k}
                onClick={() => press(k)}
                disabled={state === 'checking' || (k === 'ok' && pin.length < 4)}
                aria-label={k === 'del' ? 'Apagar' : k === 'ok' ? 'Entrar' : k}
                className={`mx-auto flex size-[4.5rem] items-center justify-center rounded-full text-2xl font-bold transition active:scale-90 disabled:opacity-30 ${
                  special
                    ? 'text-white/80 hover:bg-white/10'
                    : 'bg-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_25px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/20 backdrop-blur hover:bg-white/25'
                }`}
              >
                {k === 'del' ? <Delete className="size-6" /> : k === 'ok' ? <ArrowRight className="size-6" /> : k}
              </button>
            )
          })}
        </div>
        {state === 'error' && hint && <p className="mt-6 text-xs text-white/60">{hint}</p>}
      </div>
    </div>
  )
}
