/**
 * Light and dark theme (CPR-65). The first visit follows the operating system; an explicit choice
 * is stored on the device and wins over the system. The resolved theme lives in
 * `<html data-theme>`, which the dark token block in `src/styles/theme-dark.css` keys on.
 */
export const THEME_STORAGE_KEY = 'sineva-theme'
export type Theme = 'light' | 'dark'

/**
 * Runs in `<head>` before the first paint, so the page never flashes the other theme. Kept tiny
 * and dependency free; storage access is guarded because private modes can throw.
 */
export const THEME_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var t=s==='light'||s==='dark'?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var d=document.documentElement;d.setAttribute('data-theme',t);d.style.colorScheme=t}catch(e){}})()`

export function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme, persist = true) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  if (!persist) return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
}

export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}
