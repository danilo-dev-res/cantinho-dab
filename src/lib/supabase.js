import { createClient } from '@supabase/supabase-js'

/*
 * Conexão com o Supabase. Os valores vêm do arquivo .env (veja o README).
 *
 * A senha do site (o PIN) é a senha de verdade de um usuário do Supabase.
 * Sem entrar com ela, o banco não entrega nenhum dado nem foto.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()
export const COUPLE_EMAIL = import.meta.env.VITE_COUPLE_EMAIL?.trim()

export const isConfigured = Boolean(url && key && COUPLE_EMAIL)

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        // sessionStorage: fechou o site, pede a senha de novo.
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const BUCKET = 'fotos'

/** O PIN vira a senha real do usuário no Supabase (que exige no mínimo 6 caracteres). */
export const pinToPassword = (pin) => `dab-cantinho-${pin}`

export async function signInWithPin(pin) {
  const { error } = await supabase.auth.signInWithPassword({
    email: COUPLE_EMAIL,
    password: pinToPassword(pin),
  })
  return error
}

export async function changePin(currentPin, newPin) {
  const wrong = await signInWithPin(currentPin)
  if (wrong) return { ok: false, reason: wrong.status === 429 ? 'rate' : 'current' }
  const { error } = await supabase.auth.updateUser({ password: pinToPassword(newPin) })
  if (error) return { ok: false, reason: 'save', message: error.message }
  return { ok: true }
}

export const lockSite = () => supabase.auth.signOut({ scope: 'local' })

export const PIN_LENGTH_KEY = 'cantinho:pinLength'
export const rememberPinLength = (n) => localStorage.setItem(PIN_LENGTH_KEY, String(n))
