// The date and the reading time follow the page locale without any message: Intl knows how to
// write "5 min" and "16 October 2026" in every locale. UTC keeps the day stable between the server
// and the browser, whatever the visitor's time zone.

export function formatDate(iso: string, locale: string, dateStyle: 'medium' | 'long' = 'long') {
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone: 'UTC' }).format(new Date(iso))
}

export function formatMinutes(minutes: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  }).format(minutes)
}
