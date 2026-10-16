import { INTRO_GATE_SCRIPT } from './intro-gate-script'
import styles from './logo-intro.module.css'

/**
 * The gate, as a blocking inline script for the document <head>. No network, no external file:
 * it must run before first paint, and the browser only holds first paint for inline scripts.
 *
 * The settings travel as data attributes on the script element so the script text stays the same
 * for every build (one CSP hash, see docs/design/motion.md section 3.1). `force` is the test-only
 * override that lets Lighthouse and Playwright, which report `navigator.webdriver`, see the intro.
 */
export function LogoIntroGateScript({ enabled, force }: { enabled: boolean; force: boolean }) {
  return (
    <script
      data-enabled={enabled ? '1' : '0'}
      data-force={force ? '1' : '0'}
      dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }}
    />
  )
}

/**
 * Full-screen canvas-coloured layer that is part of the server HTML. CSS shows it only while the
 * gate has marked the document pending, so it is covering the page from the very first paint and
 * the visitor never sees the page and then a cover. It is plain markup on purpose: no image or
 * video (either would become an LCP candidate bigger than the hero text), nothing focusable, and
 * it hides itself with CSS alone by 1.8 s so a JavaScript failure can never lock the page.
 *
 * It is blank because frame 0 of the logo Lottie is blank; the client Lottie plays on top of it.
 */
export function LogoIntroShell() {
  return <div data-slot="logo-intro-shell" aria-hidden="true" className={styles.shell} />
}
