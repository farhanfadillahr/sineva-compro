import { getPathname } from './navigation'
import type { Locale } from './routing'

export type ContentKind = 'service' | 'portfolio' | 'post'
export type TranslationReference = Readonly<{
  kind: ContentKind
  entityId: string
  // Plain string: rows of a locale that is not enabled may still arrive from the content
  // layer; they are ignored because matching is by exact target locale, never by fallback.
  locale: string
  slug: string
  published: boolean
}>
export type ContentTarget =
  | Readonly<{ status: 'detail'; href: string }>
  | Readonly<{ status: 'list'; href: string }>
  | Readonly<{ status: 'unavailable' }>

const detailPathnames = {
  service: '/services/[slug]',
  // The entity stays `portfolio`; only its public URL is "work".
  portfolio: '/work/[slug]',
  post: '/blog/[slug]',
} as const

/** Resolve only metadata supplied by the owning content feature, never guessed slugs. */
export function resolveTranslatedHref(
  input: Readonly<{ kind: ContentKind; entityId: string; targetLocale: Locale }>,
  translations: readonly TranslationReference[],
): ContentTarget {
  const targets = translations.filter(
    (reference) =>
      reference.kind === input.kind &&
      reference.entityId === input.entityId &&
      reference.locale === input.targetLocale &&
      reference.published,
  )
  if (targets.length === 0 && input.kind === 'post') {
    return { status: 'list', href: getPathname({ locale: input.targetLocale, href: '/blog' }) }
  }
  if (targets.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(targets[0].slug)) {
    return { status: 'unavailable' }
  }
  return {
    status: 'detail',
    href: getPathname({
      locale: input.targetLocale,
      href: {
        pathname: detailPathnames[input.kind],
        params: { slug: targets[0].slug },
      },
    }),
  }
}
