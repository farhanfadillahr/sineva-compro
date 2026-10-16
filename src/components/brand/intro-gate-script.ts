// The pre-paint half of the logo intro gate. It has to run before first paint, so it ships as a
// blocking inline script in <head>; anything that waits for React (the original design) lets the
// page paint first and then covers it, which is a visible flash.
//
// Why a hand-minified string and not `shouldPlayIntro.toString()`: the toString of a compiled
// function depends on the bundler's minifier and target, so its size and its CSP hash would drift
// between builds. This string is byte-stable, which is what makes one sha256 valid forever (see
// docs/design/motion.md section 3.1). tests/unit/logo-intro-gate-script.test.tsx keeps it honest
// by running it against `shouldPlayIntro` for every input combination.

/** Same slot `claimSessionOnce('logo-intro')` uses (prefix `sineva:once:`). */
export const INTRO_SESSION_STORAGE_KEY = 'sineva:once:logo-intro'

// Reads its settings from its own element, so the text never changes between builds:
//   <script data-enabled="1|0" data-force="1|0">
// Rules, in the order of shouldPlayIntro: toggle off, session already claimed, automation (unless
// the test-only force flag is on), reduced motion. Gotchas:
// - `matchMedia` is called as a bare global: calling it off `window` into a local loses the
//   receiver and throws "Illegal invocation".
// - The flag is claimed here, at the moment of deciding to play, so a reload during the intro does
//   not replay it. If reading or writing storage throws, nothing is marked: with no memory the
//   intro would replay on every load.
// - Everything is in one try/catch: a failure here must never break the page, it only means no
//   intro.
export const INTRO_GATE_SCRIPT =
  '!function(){try{var s=document.currentScript.dataset,' +
  `k="${INTRO_SESSION_STORAGE_KEY}",t=sessionStorage;` +
  'if(s.enabled!=="1"||t.getItem(k)!==null||navigator.webdriver&&s.force!=="1"' +
  '||window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;' +
  't.setItem(k,"1");document.documentElement.dataset.logoIntro="pending"}catch(e){}}()'
