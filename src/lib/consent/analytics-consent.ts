/**
 * Consent for analytics cookies (CPR-109). Google Analytics stays off until the visitor accepts:
 * without a stored "granted" choice its script is never requested, so no `_ga` cookie is set and
 * nothing is sent to Google. The choice is stored on the device, like the theme.
 */
export const GA_MEASUREMENT_ID = 'G-SD295J8222'
export const CONSENT_STORAGE_KEY = 'sineva-analytics-consent'
/** Dispatched on `window` by the footer "Cookie settings" button to show the banner again. */
export const CONSENT_OPEN_EVENT = 'sineva:consent-open'
/** Dispatched on `window` after a choice is stored, so every reader re-renders. */
const CONSENT_CHANGE_EVENT = 'sineva:consent-change'

export type ConsentChoice = 'granted' | 'denied'

export function storedConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function storeConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Storage can be unavailable (private mode); the banner then comes back on the next page.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

/** `useSyncExternalStore` subscription: this tab's choices and those made in other tabs. */
export function subscribeToConsent(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) onChange()
  }
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

type AnalyticsWindow = Window & Record<string, unknown>

/**
 * Turns Google Analytics off on a page where it already loaded (consent withdrawn), and removes
 * its cookies. `ga-disable-<id>` is Google's documented opt-out flag; the cookies are expired on
 * the host and on every parent domain, because GA sets them on the widest one it can.
 */
export function disableAnalytics(measurementId = GA_MEASUREMENT_ID) {
  ;(window as unknown as AnalyticsWindow)[`ga-disable-${measurementId}`] = true
  const names = document.cookie
    .split(';')
    .map((part) => part.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
  const labels = location.hostname.split('.')
  const domains = labels.map((_, i) => labels.slice(i).join('.')).filter((d) => d.includes('.'))
  for (const name of names) {
    const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = expired
    for (const domain of domains) document.cookie = `${expired}; domain=.${domain}`
  }
}

/** Clears the opt-out flag so a script that already loaded starts measuring again. */
export function enableAnalytics(measurementId = GA_MEASUREMENT_ID) {
  delete (window as unknown as AnalyticsWindow)[`ga-disable-${measurementId}`]
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}
