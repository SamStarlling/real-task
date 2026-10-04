export const formatMinutes = (value: number) => {
  const mins = Math.round(value)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}H${m ? ` ${m}MIN` : ''}` : `${m} MIN`
}
export const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(date)
    .replace(/\./g, '')
    .toUpperCase()
export const formatLongDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    .format(date)
    .toUpperCase()
export const pbDay = (value?: string) => (value ? value.slice(0, 10) : '')
