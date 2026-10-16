import type { SectionTone } from '@/components/ui'

// Layout rules from docs/design/page-patterns.md section 4, as code so a page composition can be
// checked in a test or at render time in development:
// - adjacent sections never share the same non-white tone (white is `canvas`; two canvas bands in
//   a row simply read as one longer white area);
// - a page has at most one `inverse` section, which is the final CTA.
// `aurora` counts as non-white: it is a visible wash, so two in a row would look like one band.

export type ToneViolation = Readonly<{
  code: 'adjacent-same-tone' | 'multiple-inverse'
  /** Index in the list of the section that breaks the rule (the later of the two). */
  index: number
  tone: SectionTone
}>

export function checkSectionTones(tones: readonly SectionTone[]): ToneViolation[] {
  const violations: ToneViolation[] = []
  let inverseSeen = false
  tones.forEach((tone, index) => {
    if (tone !== 'canvas' && tones[index - 1] === tone) {
      violations.push({ code: 'adjacent-same-tone', index, tone })
    }
    if (tone === 'inverse') {
      if (inverseSeen) violations.push({ code: 'multiple-inverse', index, tone })
      inverseSeen = true
    }
  })
  return violations
}

const MESSAGES: Record<ToneViolation['code'], (v: ToneViolation) => string> = {
  'adjacent-same-tone': (v) =>
    `section ${v.index} repeats the "${v.tone}" tone of the section before it`,
  'multiple-inverse': (v) =>
    `section ${v.index} is a second inverse section (a page has at most one inverse section)`,
}

/** Throws with every violation listed. For tests and development-time page checks. */
export function assertSectionTones(tones: readonly SectionTone[]): void {
  const violations = checkSectionTones(tones)
  if (violations.length === 0) return
  throw new Error(`Invalid section tones: ${violations.map((v) => MESSAGES[v.code](v)).join('; ')}`)
}
