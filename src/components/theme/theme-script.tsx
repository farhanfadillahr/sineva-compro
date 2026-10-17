import { THEME_SCRIPT } from '@/lib/theme/theme'

/** Sets `<html data-theme>` before the first paint (no theme flash). Render inside `<head>`. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
}
