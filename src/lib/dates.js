const pad = (n) => String(n).padStart(2, '0')

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISO(new Date())

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatLong(iso) {
  const d = parseISO(iso)
  return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`
}

export function formatShort(iso) {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`
}

/** 42 dias (6 semanas) começando no domingo, para a grade do calendário. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === month }
  })
}

/** O evento acontece neste dia? Eventos "anuais" se repetem todo ano a partir da data original. */
export function occursOn(event, iso) {
  if (event.date === iso) return true
  if (!event.yearly) return false
  return event.date.slice(5) === iso.slice(5) && iso >= event.date
}

export function daysBetween(fromISO, toISOStr) {
  return Math.round((parseISO(toISOStr) - parseISO(fromISO)) / 86400000)
}

export function monthsBetween(fromISO, toISOStr) {
  const a = parseISO(fromISO)
  const b = parseISO(toISOStr)
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  if (b.getDate() < a.getDate()) m -= 1
  return m
}

/** Próxima ocorrência (hoje ou depois) de um evento. */
export function nextOccurrence(event, fromISO = todayISO()) {
  if (!event.yearly) return event.date >= fromISO ? event.date : null
  const from = parseISO(fromISO)
  const [, m, d] = event.date.split('-').map(Number)
  let candidate = toISO(new Date(from.getFullYear(), m - 1, d))
  if (candidate < fromISO) candidate = toISO(new Date(from.getFullYear() + 1, m - 1, d))
  return candidate < event.date ? event.date : candidate
}

/**
 * O que tem de especial hoje? Retorna null em dias comuns.
 * Prioridade: aniversário de namoro > data especial marcada > mêsversário.
 */
export function specialToday(settings, events, iso = todayISO()) {
  const start = settings.startDate
  if (start && iso > start && start.slice(5) === iso.slice(5)) {
    const years = parseISO(iso).getFullYear() - parseISO(start).getFullYear()
    return { type: 'anniversary', years }
  }
  const ev = events.find((e) => e.kind === 'special' && occursOn(e, iso))
  if (ev) return { type: 'event', event: ev }
  if (start && settings.monthiversary && iso > start && start.slice(8) === iso.slice(8)) {
    return { type: 'monthiversary', months: monthsBetween(start, iso) }
  }
  return null
}

/** Quanto tempo juntos, em anos, meses e dias. */
export function togetherParts(startISO, iso = todayISO()) {
  if (!startISO || iso < startISO) return null
  const months = monthsBetween(startISO, iso)
  const s = parseISO(startISO)
  let anchor = new Date(s.getFullYear(), s.getMonth() + months, s.getDate())
  // Ex.: 31/jan + 1 mês não existe, então usamos o último dia de fevereiro.
  if (anchor.getDate() !== s.getDate()) anchor = new Date(s.getFullYear(), s.getMonth() + months + 1, 0)
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: daysBetween(toISO(anchor), iso),
    total: daysBetween(startISO, iso),
  }
}

/** Fotos tiradas neste mesmo dia em anos anteriores. */
export const onThisDay = (photos, iso = todayISO()) =>
  photos.filter((p) => p.date && p.date.slice(5) === iso.slice(5) && p.date < iso)

/** A data (ISO) de cada dia desta semana, de segunda (0) a domingo (6). */
export function thisWeekDates(base = new Date()) {
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((base.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => toISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)))
}

export const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`

/** Eventos do calendário + o dia em que começaram a namorar (entra sozinho, todo ano). */
export function withAnniversary(events, settings) {
  const list = [...events]
  if (settings.startDate) {
    list.push({
      id: '__start', title: 'Nosso dia', date: settings.startDate, emoji: '💞', kind: 'special',
      yearly: true, note: 'O dia em que tudo começou.', photoIds: [], auto: true,
    })
  }
  return list
}

/** Próximas datas especiais, da mais perto para a mais longe. */
export function upcomingSpecials(allEvents, iso = todayISO(), limit = 6) {
  return allEvents
    .filter((e) => e.kind === 'special')
    .map((e) => ({ ...e, next: nextOccurrence(e, iso) }))
    .filter((e) => e.next)
    .sort((a, b) => a.next.localeCompare(b.next))
    .slice(0, limit)
}

export const weekdayIndex = (d = new Date()) => (d.getDay() + 6) % 7
