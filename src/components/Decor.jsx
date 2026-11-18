/** Fundo com manchas de cor se mexendo devagar. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob absolute -left-32 -top-32 size-[28rem] rounded-full bg-violet-300/40 blur-3xl" />
      <div className="blob absolute -right-40 top-1/4 size-[30rem] rounded-full bg-fuchsia-300/30 blur-3xl [animation-delay:-7s]" />
      <div className="blob absolute -bottom-40 left-1/4 size-[32rem] rounded-full bg-purple-300/30 blur-3xl [animation-delay:-14s]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.07)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  )
}

/** O selo DAB. */
export function Monogram({ size = 'md', light = false }) {
  const s = {
    sm: 'h-9 px-2.5 text-xs',
    md: 'h-11 px-3 text-sm',
    lg: 'h-14 px-5 text-xl',
  }[size]
  return (
    <span
      title="Nosso ship 💜"
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl font-display font-bold tracking-[0.25em] ${s} ${
        light
          ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur'
          : 'bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-400/40'
      }`}
    >
      <span className="-mr-[0.25em]">DAB</span>
    </span>
  )
}

/** Bolinha com a inicial do nome. */
export function Avatar({ name, who = 'a', size = 'md' }) {
  const colors = {
    a: 'from-violet-500 to-indigo-500',
    b: 'from-fuchsia-500 to-pink-500',
    both: 'from-violet-500 to-fuchsia-500',
  }[who]
  const s = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-12 text-lg', lg: 'size-16 text-2xl' }[size]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-extrabold text-white ring-2 ring-white ${colors} ${s}`}>
      {who === 'both' ? '♥' : (name?.trim()?.[0] ?? '?').toUpperCase()}
    </span>
  )
}

export function Spinner({ className = 'size-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center p-10 text-center">
      <span className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-500">
        <Icon className="size-7" />
      </span>
      <p className="font-display text-xl font-bold">{title}</p>
      {text && <p className="mt-1 text-sm text-violet-500">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
