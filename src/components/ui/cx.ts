export type ClassValue = string | false | null | undefined

// Joins class names. There is deliberately no tailwind-merge: every class in this kit comes from a
// static map, so conflicts are resolved by choosing the right map entry, not by string order. A
// caller className is appended last but cannot reliably override a conflicting utility already on
// the element (Tailwind orders its stylesheet, not the class attribute); use it for layout (w-full,
// max-w-*, margins), not to restyle a variant.
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}

// docs/design/components.md: every interactive element shows a 2 px --color-focus ring with a 2 px
// offset on :focus-visible. An outline (not a box-shadow ring) follows border-radius in current
// browsers and stays visible in forced-colors mode. Gotcha: an `overflow-hidden` ancestor still
// clips it, so leave room (or move the overflow) around focusable children of such containers.
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

// Visible height stays small for sm buttons and chips (36 px) while the pointer and touch target
// grows to 44 px through an invisible pseudo-element. Requires `relative` on the element. A
// pseudo-element rather than padding/min-height because the visible box must stay 36 px.
export const hitArea44 =
  "after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']"
