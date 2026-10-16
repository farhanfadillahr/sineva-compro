// The pre-paint half of the logo intro gate. It has to run before first paint, so it ships as a
// blocking inline script in <head>; anything that waits for React (the original design) lets the
// page paint first and then covers it, which is a visible flash.
//
// Why a hand-minified string and not `shouldPlayIntro.toString()`: the toString of a compiled
// function depends on the bundler's minifier and target, so its size and its CSP hash would drift
// between builds. This string is byte-stable, which is what makes one sha256 valid forever (see
// docs/design/motion.md section 3.1). tests/unit/logo-intro-gate-script.test.tsx keeps it honest
// by running it against `shouldPlayIntro` for every input combination.

// Reads its settings from its own element, so the text never changes between builds:
//   <script data-enabled="1|0" data-force="1|0">
// Rules, in the order of shouldPlayIntro: toggle off, automation (unless the test-only force flag
// is on), reduced motion. The splash plays on every full page load, refresh included (owner's
// decision, 2026-10-16); client-side navigation never re-runs this script, so moving between pages
// inside the site never shows it. No storage is read or written, so a blocked or full storage can
// never hide it. Gotchas:
// - `matchMedia` is called as a bare global: calling it off `window` into a local loses the
//   receiver and throws "Illegal invocation".
// - Everything is in one try/catch: a failure here must never break the page, it only means no
//   intro.
export const INTRO_GATE_SCRIPT =
  '!function(){try{var s=document.currentScript.dataset;' +
  'if(s.enabled!=="1"||navigator.webdriver&&s.force!=="1"' +
  '||window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;' +
  'document.documentElement.dataset.logoIntro="pending"}catch(e){}}()'
