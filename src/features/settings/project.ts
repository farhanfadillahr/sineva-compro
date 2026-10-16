/**
 * Pure conversions between stored settings and the public `SiteSettingsDTO`.
 *
 * WhatsApp template placeholders (contract with CPR-45, documented in docs/runbooks/cms.md):
 * - `{site}`    site name, every template
 * - `{product}` product name, product template only
 * - `{service}` service title, per-service templates only
 * Placeholders are resolved here, on the server, so the landing page receives final messages and
 * builds `wa.me` links without knowing about templates. Unknown placeholders are rejected on save.
 */
import type { ContentLocale, MediaAsset, SiteSettingsDTO } from '../content/types'
import type { FieldErrors, MediaValue } from '../cms/fields'
import type { SettingsGlobal, SettingsLocale } from './fields'

export const TEMPLATE_PLACEHOLDERS = {
  general: ['site'],
  product: ['site', 'product'],
  thankYou: ['site'],
  service: ['site', 'service'],
} as const

const PLACEHOLDER = /\{([^{}]*)\}/g

/** Replaces known placeholders; unknown ones are left as written (save rejects them). */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(PLACEHOLDER, (match, name: string) => values[name] ?? match)
}

function unknownPlaceholders(template: string, allowed: readonly string[]): string[] {
  return [...template.matchAll(PLACEHOLDER)]
    .map((match) => match[1])
    .filter((name) => !allowed.includes(name))
}

/** Template rules that the generic field validator cannot express. */
export function validateSettingsLocale(local: SettingsLocale, prefix = ''): FieldErrors {
  const errors: FieldErrors = {}
  const check = (path: string, template: string, allowed: readonly string[]) => {
    const unknown = unknownPlaceholders(template, allowed)
    if (unknown.length)
      errors[`${prefix}${path}`] =
        `Placeholder tidak dikenal: ${unknown.map((name) => `{${name}}`).join(', ')}. Gunakan ${allowed
          .map((name) => `{${name}}`)
          .join(', ')}.`
  }
  check('whatsapp.general', local.whatsapp.general, TEMPLATE_PLACEHOLDERS.general)
  check('whatsapp.product', local.whatsapp.product, TEMPLATE_PLACEHOLDERS.product)
  check('whatsapp.thankYou', local.whatsapp.thankYou, TEMPLATE_PLACEHOLDERS.thankYou)
  local.whatsapp.services.forEach((entry, index) =>
    check(`whatsapp.services.${index}.message`, entry.message, TEMPLATE_PLACEHOLDERS.service),
  )
  const slugs = local.whatsapp.services.map((entry) => entry.serviceSlug)
  slugs.forEach((slug, index) => {
    if (slugs.indexOf(slug) !== index)
      errors[`${prefix}whatsapp.services.${index}.serviceSlug`] =
        'Layanan ini sudah memiliki pesan.'
  })
  if (!local.seo.titleTemplate.includes('{title}'))
    errors[`${prefix}seo.titleTemplate`] = 'Template judul wajib memuat {title}.'
  else {
    const unknown = unknownPlaceholders(local.seo.titleTemplate, ['title'])
    if (unknown.length) errors[`${prefix}seo.titleTemplate`] = 'Gunakan hanya placeholder {title}.'
  }
  return errors
}

/** Keeps one WhatsApp entry per current service, in service order; drops removed services. */
export function alignServiceTemplates(
  entries: readonly { serviceSlug: string; message: string }[],
  services: readonly { slug: string }[],
): { serviceSlug: string; message: string }[] {
  return services.map((service) => ({
    serviceSlug: service.slug,
    message:
      entries.find((entry) => entry.serviceSlug === service.slug)?.message ??
      "Hi {site}, I'm interested in {service}. Can we talk?",
  }))
}

export function projectSiteSettings(input: {
  locale: ContentLocale
  global: SettingsGlobal
  local: SettingsLocale
  services: readonly { slug: string; title: string }[]
  media: { defaultOgImage: MediaAsset | null; logo: MediaAsset | null }
}): SiteSettingsDTO {
  const { global, local, locale } = input
  const site = global.brand.siteName
  const product = global.brand.productName
  return {
    locale,
    brand: {
      siteName: site,
      productName: product,
      defaultOgImage: input.media.defaultOgImage,
      logo: input.media.logo,
    },
    contact: {
      email: global.contact.email,
      businessHours: local.contact.businessHours,
      address: global.contact.address,
      legalEntity: global.contact.legalEntityName
        ? {
            name: global.contact.legalEntityName,
            registrationNumber: global.contact.legalEntityRegistration,
          }
        : null,
    },
    whatsapp: {
      number: global.contact.whatsappNumber,
      templates: {
        general: fillTemplate(local.whatsapp.general, { site }),
        product: fillTemplate(local.whatsapp.product, { site, product }),
        thankYou: fillTemplate(local.whatsapp.thankYou, { site }),
        // Only services that exist and have a message; the title comes from the service itself.
        services: input.services.flatMap((service) => {
          const entry = local.whatsapp.services.find((item) => item.serviceSlug === service.slug)
          return entry
            ? [
                {
                  serviceSlug: service.slug,
                  message: fillTemplate(entry.message, { site, service: service.title }),
                },
              ]
            : []
        }),
      },
    },
    social: { ...global.social },
    features: { ...global.features },
    analytics: {
      enabled: global.analytics.enabled && !!global.analytics.umamiWebsiteId,
      umamiWebsiteId: global.analytics.umamiWebsiteId,
    },
    seo: {
      titleTemplate: local.seo.titleTemplate,
      defaultDescription: local.seo.defaultDescription,
      indexable: global.seo.indexable,
    },
    verification: { googleSearchConsoleToken: global.verification.googleSearchConsoleToken },
  }
}

const staticMedia = (asset: MediaAsset | null): MediaValue =>
  asset
    ? { kind: 'static', url: asset.url, width: asset.width, height: asset.height, alt: asset.alt }
    : null

/**
 * Stored form of a settings DTO, used to seed the database from the static launch content so the
 * site renders the same copy after switching to the database source.
 */
export function settingsFromDto(
  dto: SiteSettingsDTO,
  extra: { inboxEmails?: string[] } = {},
): { global: SettingsGlobal; local: SettingsLocale } {
  return {
    global: {
      brand: {
        siteName: dto.brand.siteName,
        productName: dto.brand.productName,
        defaultOgImage: staticMedia(dto.brand.defaultOgImage),
        logo: staticMedia(dto.brand.logo),
      },
      contact: {
        email: dto.contact.email,
        whatsappNumber: dto.whatsapp.number,
        address: dto.contact.address,
        legalEntityName: dto.contact.legalEntity?.name ?? null,
        legalEntityRegistration: dto.contact.legalEntity?.registrationNumber ?? null,
      },
      social: { ...dto.social },
      leadRouting: { inboxEmails: extra.inboxEmails ?? [], waitlistNotifications: false },
      features: { ...dto.features },
      analytics: { ...dto.analytics },
      verification: { ...dto.verification },
      seo: { indexable: dto.seo.indexable },
    },
    local: {
      contact: { businessHours: dto.contact.businessHours },
      whatsapp: {
        general: dto.whatsapp.templates.general,
        product: dto.whatsapp.templates.product,
        thankYou: dto.whatsapp.templates.thankYou,
        services: dto.whatsapp.templates.services.map((entry) => ({ ...entry })),
      },
      seo: { titleTemplate: dto.seo.titleTemplate, defaultDescription: dto.seo.defaultDescription },
    },
  }
}

/** `wa.me` needs digits only; settings store E.164 with the plus. */
export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
