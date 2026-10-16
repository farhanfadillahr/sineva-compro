// Breakpoints from docs/design/tokens.md section 3 as media queries, for the few places that must
// know the viewport in JS. Styling uses Tailwind breakpoints (lg, md); keep these in step.

/** Desktop navbar from 1024 px (`lg`), mobile menu below. */
export const DESKTOP_QUERY = '(min-width: 1024px)'

/** Footer columns collapse into accordions below 768 px (`md`). */
export const FOOTER_ACCORDION_QUERY = '(max-width: 767.98px)'
