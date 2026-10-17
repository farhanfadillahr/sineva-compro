'use client'
import { useEffect, useSyncExternalStore } from 'react'
import { applyTheme, readTheme, storedTheme, type Theme } from '@/lib/theme/theme'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** The current theme, `light` during server rendering and hydration. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => 'light')
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  )
}

/**
 * Switches between light and dark. The label names the action ("Switch to dark mode"), so screen
 * readers hear what pressing it does. Without a stored choice the page keeps following the
 * operating system, also when it changes while the page is open.
 */
export function ThemeToggle({
  labels,
  className,
}: {
  labels: { toDark: string; toLight: string }
  className?: string
}) {
  const theme = useTheme()
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const follow = (event: MediaQueryListEvent) => {
      if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light', false)
    }
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [])
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className={className}
      aria-label={next === 'dark' ? labels.toDark : labels.toLight}
      title={next === 'dark' ? labels.toDark : labels.toLight}
      onClick={() => applyTheme(next)}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
