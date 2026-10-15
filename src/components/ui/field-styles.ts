import { cx, focusRing } from './cx'

// Shared look of input, textarea and select (docs/design/components.md section 6): 1 px
// --color-border-input (3.30:1 on white, passes the 3:1 non-text rule), radius --radius-sm,
// 16 px text so iOS Safari does not zoom on focus.
//
// State is driven by attributes, not props: `aria-invalid="true"` turns the border red, so a
// field is never red unless it is also announced as invalid. The compound `aria-[invalid=true]:`
// hover and focus entries exist because Tailwind sorts hover/focus variants after aria variants,
// which would otherwise repaint an invalid field's border teal while it is focused.
export const fieldControlClasses = cx(
  'w-full rounded-sm border border-border-input bg-surface px-4 text-base text-text',
  'placeholder:text-text-tertiary',
  'transition-[border-color] duration-(--dur-fast) ease-out motion-reduce:transition-none',
  'hover:border-text-secondary focus-visible:border-action-primary',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:hover:border-danger',
  'aria-[invalid=true]:focus-visible:border-danger',
  'disabled:cursor-not-allowed disabled:opacity-45',
  focusRing,
)
