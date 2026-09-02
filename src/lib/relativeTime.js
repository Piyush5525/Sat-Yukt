// Formats an ISO timestamp as a locale-aware relative time string ("5 minutes
// ago", "2 hours ago"), using the browser's built-in Intl.RelativeTimeFormat
// so it automatically matches whichever UI language is active — no need to
// hand-translate time phrases per locale.

const DIVISIONS = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Infinity, unit: 'year' },
]

// Maps our app language keys to BCP-47 locales Intl understands.
const INTL_LOCALES = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
}

export function formatRelativeTime(isoTimestamp, languageKey) {
  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) return ''

  let duration = (date.getTime() - Date.now()) / 1000

  const locale = INTL_LOCALES[languageKey] || 'en-IN'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}
