import { expect, it } from 'vitest'
import type { Link } from '../../src/i18n/navigation'
import type { ButtonProps } from '../../src/components/ui/button'

// Compile-time check, enforced by `npm run typecheck`: the localised next-intl Link must be
// assignable to Button's `linkComponent` prop. Type-only imports, so no i18n runtime loads here;
// the function is never called because there is nothing to render, only a type to satisfy.
function asLinkComponent(link: typeof Link): ButtonProps['linkComponent'] {
  return link
}

it('accepts the next-intl Link as linkComponent', () => {
  expect(typeof asLinkComponent).toBe('function')
})
