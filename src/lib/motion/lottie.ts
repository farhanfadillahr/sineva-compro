import type { AnimationItem } from 'lottie-web/build/player/lottie_light'

// Only the light build is allowed anywhere in the app (motion.md section 7): SVG renderer, no
// expressions engine, no eval, so the CSP needs no 'unsafe-eval'. The full build is roughly twice
// the size. tests/unit/motion-lottie.test.ts fails if any other lottie-web specifier appears.
export type { AnimationItem as LottieAnimation }

type LottiePlayerApi = {
  loadAnimation: (params: {
    container: Element
    renderer: 'svg'
    loop: boolean
    autoplay: boolean
    animationData: unknown
    rendererSettings?: { preserveAspectRatio?: string }
  }) => AnimationItem
}

let pending: Promise<LottiePlayerApi> | null = null

/**
 * Lazy-load the lottie-web light player. The dynamic import is what keeps it out of the initial
 * bundle: it is only requested once a LottiePlayer scrolls into view. A failed load is not cached.
 */
export function loadLottie(): Promise<LottiePlayerApi> {
  pending ??= import('lottie-web/build/player/lottie_light')
    .then((mod) => (mod.default ?? mod) as unknown as LottiePlayerApi)
    .catch((error: unknown) => {
      pending = null
      throw error
    })
  return pending
}

/** Fetch the animation JSON. Rejects on a non-2xx status so callers can treat it as a failure. */
export async function fetchLottieData(src: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(src, { signal })
  if (!response.ok) throw new Error(`Lottie JSON request failed: ${response.status}`)
  return response.json()
}
