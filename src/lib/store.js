import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BUCKET, supabase } from './supabase'
import { preparePhoto, randomTilt } from './image'
import { todayISO } from './dates'
import { useUI } from './ui'

/*
 * Tudo do site fica na tabela "items" do Supabase:
 *   id (uuid) · kind ("event" | "photo" | "schedule" | "settings") · data (jsonb) · created_at
 * As fotos em si ficam no Storage, na pasta (bucket) "fotos".
 * Quando um de vocês muda algo, o outro celular recebe na hora (Realtime).
 */
const TABLE = 'items'
const COLUMNS = 'id, data, created_at'
const toItem = (row) => ({ ...row.data, id: row.id, createdAt: row.created_at })

// Campos calculados no navegador que não devem ir para o banco.
const LOCAL_ONLY = ['id', 'createdAt', 'url', 'thumbUrl']
const stripLocal = (item) => Object.fromEntries(Object.entries(item).filter(([k]) => !LOCAL_ONLY.includes(k)))

export function useCollection(kind) {
  const { toast } = useUI()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq('kind', kind).order('created_at')
    if (error) toast(`Não consegui carregar (${kind}): ${error.message}`, 'error')
    else setItems(data.map(toItem))
    setLoading(false)
  }, [kind, toast])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`items-${kind}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        // Exclusões não dizem o tipo, então recarregamos por garantia.
        if (payload.eventType === 'DELETE' || payload.new?.kind === kind) load()
      })
      .subscribe()
    window.addEventListener('focus', load)
    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', load)
    }
  }, [kind, load])

  const save = useCallback(
    async (item) => {
      const data = stripLocal(item)
      const exists = item.id && itemsRef.current.some((i) => i.id === item.id)
      const query = exists
        ? supabase.from(TABLE).update({ data }).eq('id', item.id)
        : supabase.from(TABLE).insert({ kind, data })
      const { data: row, error } = await query.select(COLUMNS).single()
      if (error) {
        toast('Não consegui salvar 😢\n' + error.message, 'error')
        throw error
      }
      const saved = toItem(row)
      setItems((prev) =>
        prev.some((i) => i.id === saved.id) ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved],
      )
      return saved
    },
    [kind, toast],
  )

  const remove = useCallback(
    async (id) => {
      const before = itemsRef.current
      setItems((prev) => prev.filter((i) => i.id !== id))
      const { error } = await supabase.from(TABLE).delete().eq('id', id)
      if (error) {
        setItems(before)
        toast('Não consegui apagar 😢\n' + error.message, 'error')
        throw error
      }
    },
    [toast],
  )

  return { items, save, remove, loading, reload: load }
}

/* ---------------- Fotos ---------------- */

const SIGN_SECONDS = 60 * 60 * 12

/** Fotos com links temporários (as fotos são privadas: só abrem para quem entrou com a senha). */
export function usePhotos() {
  const col = useCollection('photo')
  const { toast } = useUI()
  const [urls, setUrls] = useState({})
  const requested = useRef(new Set())

  useEffect(() => {
    const missing = col.items
      .flatMap((p) => [p.path, p.thumb])
      .filter((path) => path && !requested.current.has(path))
    if (!missing.length) return
    missing.forEach((p) => requested.current.add(p))
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, SIGN_SECONDS)
      .then(({ data }) => {
        if (!data) return
        setUrls((prev) => {
          const next = { ...prev }
          for (const d of data) if (d.signedUrl) next[d.path] = d.signedUrl
          return next
        })
      })
  }, [col.items])

  const items = useMemo(
    () =>
      col.items.map((p) => ({ ...p, url: urls[p.path], thumbUrl: urls[p.thumb] ?? urls[p.path] })),
    [col.items, urls],
  )

  /** Envia várias fotos (3 de cada vez). onProgress(feitas, total). */
  const upload = useCallback(
    async (files, extra = {}, onProgress = () => {}) => {
      const list = [...files].filter((f) => !f.type || f.type.startsWith('image/'))
      const saved = []
      let done = 0
      onProgress(0, list.length)
      const queue = [...list]
      const worker = async () => {
        while (queue.length) {
          const file = queue.shift()
          try {
            const { full, thumb } = await preparePhoto(file)
            const name = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
            const path = `${name}.jpg`
            const thumbPath = `thumbs/${name}.jpg`
            for (const [p, blob] of [[path, full], [thumbPath, thumb]]) {
              const { error } = await supabase.storage.from(BUCKET).upload(p, blob, { contentType: 'image/jpeg' })
              if (error) throw error
            }
            saved.push(
              await col.save({
                path, thumb: thumbPath, caption: '', date: todayISO(), tilt: randomTilt(), ...extra,
              }),
            )
          } catch (e) {
            toast(`Uma foto não foi enviada: ${e.message}`, 'error')
          }
          onProgress(++done, list.length)
        }
      }
      await Promise.all([worker(), worker(), worker()])
      return saved
    },
    [col, toast],
  )

  const removePhoto = useCallback(
    async (photo) => {
      await col.remove(photo.id)
      await supabase.storage.from(BUCKET).remove([photo.path, photo.thumb].filter(Boolean))
    },
    [col],
  )

  return { ...col, items, upload, removePhoto }
}

/* ---------------- Configurações (aba Nós) ---------------- */

export const DEFAULT_SETTINGS = {
  nameA: 'Danilo',
  nameB: 'Bia',
  startDate: '',
  monthiversary: true,
}

export function useSettings() {
  const { items, save, loading } = useCollection('settings')
  const stored = items[0]
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...(stored ?? {}) }), [stored])

  // Guarda os nomes para mostrar na tela de senha (antes de entrar).
  useEffect(() => {
    if (stored) localStorage.setItem('cantinho:names', JSON.stringify([settings.nameA, settings.nameB]))
  }, [stored, settings.nameA, settings.nameB])

  const setSettings = (patch) => save({ ...(stored ?? {}), ...patch })
  return { settings, setSettings, loading }
}

export function cachedNames() {
  try {
    const [a, b] = JSON.parse(localStorage.getItem('cantinho:names')) ?? []
    return { nameA: a || DEFAULT_SETTINGS.nameA, nameB: b || DEFAULT_SETTINGS.nameB }
  } catch {
    return { nameA: DEFAULT_SETTINGS.nameA, nameB: DEFAULT_SETTINGS.nameB }
  }
}

/* ---------------- Trazer dados das versões antigas ---------------- */

const readLocal = (kind) => {
  try {
    return JSON.parse(localStorage.getItem(`cantinho:${kind}`)) ?? []
  } catch {
    return []
  }
}

export const hasLocalData = () => ['photo', 'event', 'schedule'].some((k) => readLocal(k).length > 0)

/** Envia para o banco o que ficou salvo só neste navegador nas versões anteriores. */
export async function migrateLocal({ photos, events, schedule, settings, setSettings }, onProgress) {
  const oldPhotos = readLocal('photo')
  const oldEvents = readLocal('event')
  const oldSchedule = readLocal('schedule')
  const total = oldPhotos.length + oldEvents.length + oldSchedule.length
  let done = 0
  const tick = () => onProgress(++done, total)

  const idMap = {}
  for (const p of oldPhotos) {
    if (p.src) {
      const blob = await (await fetch(p.src)).blob()
      const [saved] = await photos.upload([blob], { caption: p.caption ?? '', date: p.date ?? todayISO(), tilt: p.tilt ?? randomTilt() })
      if (saved) idMap[p.id] = saved.id
    }
    tick()
  }
  for (const e of oldEvents) {
    const { id: _id, ...rest } = e
    await events.save({ ...rest, photoIds: (e.photoIds ?? []).map((id) => idMap[id]).filter(Boolean) })
    tick()
  }
  for (const s of oldSchedule) {
    const { id: _id, ...rest } = s
    await schedule.save(rest)
    tick()
  }
  const oldSettings = readLocal('settings')[0]
  if (oldSettings && !settings.startDate && oldSettings.startDate) {
    await setSettings({
      nameA: oldSettings.nameA, nameB: oldSettings.nameB,
      startDate: oldSettings.startDate, monthiversary: oldSettings.monthiversary ?? true,
    })
  }
  for (const k of ['photo', 'event', 'schedule', 'settings']) localStorage.removeItem(`cantinho:${k}`)
  return total
}
