import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  loadContactModel,
  loadThankYouModel,
  type ContactModel,
  type ThankYouModel,
} from '@/components/pages/contact/contact-model'
import {
  buildContactMetadata,
  buildThankYouMetadata,
} from '@/components/pages/contact/contact-metadata'
import { ContactView } from '@/components/pages/contact/contact-view'
import { ThankYouView } from '@/components/pages/contact/thank-you-view'
import type { PublicContentSource } from '@/features/content/public'
import { createStaticContentSource } from '../../src/content/static'
import { siteSettings } from '../../src/content/static/site-settings'
import en from '../../messages/en.json'
import { criticalAxeViolations } from './sections-test-utils'

const root = join(import.meta.dirname, '../..')
const intl = (ui: ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  )

let contactModel: ContactModel
let thankYouModel: ThankYouModel

async function models() {
  const source = createStaticContentSource()
  contactModel = (await loadContactModel(source, 'en'))!
  thankYouModel = (await loadThankYouModel(source, 'en'))!
}

const withContact = (patch: Partial<typeof siteSettings.contact>): ContactModel => ({
  ...contactModel,
  settings: { ...siteSettings, contact: { ...siteSettings.contact, ...patch } },
})

const FORM = <div data-testid="form-slot">form goes here</div>

describe('model loaders', () => {
  it('load the page and the settings through the content contract', async () => {
    await models()
    expect(contactModel.page.key).toBe('contact')
    expect(contactModel.settings?.whatsapp.number).toBe('+6285199368510')
    expect(thankYouModel.page.key).toBe('thankYou')
    expect(thankYouModel.settings).not.toBeNull()
  })

  it('answer null for a locale without the page, so the route can 404', async () => {
    const empty = {
      getPage: async () => null,
      getSiteSettings: async () => null,
    } as unknown as PublicContentSource
    expect(await loadContactModel(empty, 'en')).toBeNull()
    expect(await loadThankYouModel(empty, 'en')).toBeNull()
  })

  it('keep a page when settings are missing: the settings are optional extras', async () => {
    const source = createStaticContentSource()
    const noSettings = {
      ...source,
      getSiteSettings: async () => null,
    } as PublicContentSource
    const model = await loadContactModel(noSettings, 'en')
    expect(model?.settings).toBeNull()
  })
})

describe('Contact page', () => {
  it('is one main landmark, the skip link target, with one h1 and no skipped heading level', async () => {
    await models()
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    const main = container.querySelector('main')!
    expect(main.id).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(container.querySelectorAll('main')).toHaveLength(1)
    const headings = screen.getAllByRole('heading')
    expect(headings.filter((h) => h.tagName === 'H1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(contactModel.page.headline)
    // h1 first, then only h2: nothing jumps a level.
    expect(headings.slice(1).every((h) => h.tagName === 'H2')).toBe(true)
  })

  it('sits on the alternate canvas, with the lead under the headline', async () => {
    await models()
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    expect(container.querySelector('main [data-tone="alt"]')).not.toBeNull()
    expect(screen.getByText(contactModel.page.lead)).toBeTruthy()
  })

  it('shows the meta chips from the content, centred, with no 15 minute call or response time', async () => {
    await models()
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    const chips = within(screen.getByRole('list', { name: 'Highlights' })).getAllByRole('listitem')
    expect(chips.map((c) => c.textContent)).toEqual(
      contactModel.page.metaChips.map((chip) => expect.stringContaining(chip)),
    )
    expect(container.querySelector('[data-slot="meta-chips"]')?.className).toContain(
      'justify-center',
    )
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/15 min/i)
    expect(text).not.toMatch(/within (one|1|\d+) (business )?(day|hour)/i)
  })

  it('renders the three steps as card-step items with their numbers', async () => {
    await models()
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    const steps = Array.from(container.querySelectorAll('[data-variant="step"]'))
    expect(steps).toHaveLength(3)
    steps.forEach((step, index) => {
      expect(step.textContent).toContain(contactModel.page.steps[index]!.title)
      expect(step.textContent).toContain(contactModel.page.steps[index]!.body)
      expect(step.textContent).toContain(String(index + 1))
    })
  })

  it('renders the form slot in the right column, after the steps in reading order', async () => {
    await models()
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    const slot = screen.getByTestId('form-slot')
    const firstStep = container.querySelector('[data-variant="step"]')!
    expect(firstStep.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.closest('[data-slot="form-card"]')).not.toBeNull()
  })

  it('offers WhatsApp as the alternative, opening the general message in a new tab', async () => {
    await models()
    intl(<ContactView model={contactModel} form={FORM} />)
    const link = screen.getByRole('link', { name: 'Chat on WhatsApp' })
    const href = link.getAttribute('href')!
    expect(href.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    expect(decodeURIComponent(href)).toContain(siteSettings.whatsapp.templates.general)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('hides the WhatsApp alternative when the number is unusable, never a dead link', async () => {
    await models()
    const model = {
      ...contactModel,
      settings: { ...siteSettings, whatsapp: { ...siteSettings.whatsapp, number: '0812' } },
    }
    intl(<ContactView model={model} form={FORM} />)
    expect(screen.queryByRole('link', { name: 'Chat on WhatsApp' })).toBeNull()
  })

  it('hides the address, the email and the hours while they are empty (phase 1 settings)', async () => {
    await models()
    expect(siteSettings.contact).toMatchObject({ email: null, address: null, businessHours: null })
    const { container } = intl(<ContactView model={contactModel} form={FORM} />)
    expect(screen.queryByText('Address')).toBeNull()
    expect(screen.queryByText('Email')).toBeNull()
    expect(screen.queryByText('Opening hours')).toBeNull()
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(container.querySelector('dl')).toBeNull()
  })

  it('shows the address only when it is filled', async () => {
    await models()
    intl(<ContactView model={withContact({ address: 'Jl. Contoh 1, Jakarta' })} form={FORM} />)
    expect(screen.getByText('Address')).toBeTruthy()
    expect(screen.getByText('Jl. Contoh 1, Jakarta')).toBeTruthy()
    expect(screen.queryByText('Email')).toBeNull()
  })

  it('shows the email as a mailto link and the opening hours when filled', async () => {
    await models()
    intl(
      <ContactView
        model={withContact({
          email: 'hello@sineva.id',
          businessHours: 'Monday to Friday, 9 to 17',
        })}
        form={FORM}
      />,
    )
    expect(screen.getByRole('link', { name: 'hello@sineva.id' }).getAttribute('href')).toBe(
      'mailto:hello@sineva.id',
    )
    expect(screen.getByText('Monday to Friday, 9 to 17')).toBeTruthy()
  })

  it('shows a response time line only when the content carries an approved one', async () => {
    await models()
    expect(contactModel.page.responseTimeText).toBeNull()
    const { unmount } = intl(<ContactView model={contactModel} form={FORM} />)
    expect(screen.queryByText('We reply within one business day.')).toBeNull()
    unmount()
    intl(
      <ContactView
        model={{
          ...contactModel,
          page: { ...contactModel.page, responseTimeText: 'We reply within one business day.' },
        }}
        form={FORM}
      />,
    )
    expect(screen.getByText('We reply within one business day.')).toBeTruthy()
  })

  it('has no critical accessibility violation', async () => {
    await models()
    const { container } = intl(
      <ContactView
        model={withContact({ email: 'hello@sineva.id', address: 'Jl. Contoh 1, Jakarta' })}
        form={FORM}
      />,
    )
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('Thank-you page', () => {
  it('is one main landmark with one h1 from the content', async () => {
    await models()
    const { container } = intl(<ThankYouView model={thankYouModel} />)
    const main = container.querySelector('main')!
    expect(main.id).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(thankYouModel.page.headline)
    expect(screen.getByText(thankYouModel.page.body)).toBeTruthy()
  })

  it('shows Sino giving a thumbs up as a decorative plain image, with a static check icon', async () => {
    await models()
    const { container } = intl(<ThankYouView model={thankYouModel} />)
    const img = container.querySelector('img')!
    expect(decodeURIComponent(img.getAttribute('src')!)).toContain('/mascot/poses/sino-thumbs-up')
    expect(img.getAttribute('alt')).toBe('')
    expect(existsSync(join(root, 'public/mascot/poses/sino-thumbs-up.webp'))).toBe(true)
    const check = container.querySelector('[data-slot="check-icon"]')!
    expect(check.getAttribute('aria-hidden')).toBe('true')
    // The animated check (Lottie L3) is deferred: nothing here may load the player.
    expect(container.querySelector('canvas, [data-lottie]')).toBeNull()
  })

  it('opens WhatsApp with the thank-you template for a faster reply', async () => {
    await models()
    intl(<ThankYouView model={thankYouModel} />)
    const link = screen.getByRole('link', { name: thankYouModel.page.whatsappCtaLabel })
    const href = link.getAttribute('href')!
    expect(href.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    expect(decodeURIComponent(href)).toContain(siteSettings.whatsapp.templates.thankYou)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('hides the WhatsApp button without a usable number', async () => {
    await models()
    intl(
      <ThankYouView
        model={{
          ...thankYouModel,
          settings: { ...siteSettings, whatsapp: { ...siteSettings.whatsapp, number: '' } },
        }}
      />,
    )
    expect(screen.queryByRole('link', { name: thankYouModel.page.whatsappCtaLabel })).toBeNull()
  })

  it('links to the Blog and to the Product page from the content labels', async () => {
    await models()
    intl(<ThankYouView model={thankYouModel} />)
    expect(screen.getByRole('link', { name: 'Read the blog' }).getAttribute('href')).toBe('/blog')
    expect(screen.getByRole('link', { name: 'Explore AI Agents' }).getAttribute('href')).toBe(
      '/products/ai-agents',
    )
  })

  it('has no critical accessibility violation', async () => {
    await models()
    const { container } = intl(<ThankYouView model={thankYouModel} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('metadata', () => {
  it('titles the Contact page from its SEO fields, without doubling the brand', async () => {
    await models()
    const meta = buildContactMetadata(contactModel.page, contactModel.settings)
    expect(meta.title).toEqual({ absolute: contactModel.page.seo.metaTitle })
    expect(meta.description).toBe(contactModel.page.seo.metaDescription)
    expect(meta.alternates?.canonical).toBe('/contact')
  })

  it('leaves Contact indexable by the page itself (the site wide launch gate is the layout)', async () => {
    await models()
    expect(buildContactMetadata(contactModel.page, contactModel.settings).robots).toBeUndefined()
  })

  it('marks the thank-you page noindex and nofollow', async () => {
    await models()
    expect(buildThankYouMetadata(thankYouModel.page, thankYouModel.settings).robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it('keeps the thank-you page noindex even if an editor clears the flag', async () => {
    await models()
    const page = { ...thankYouModel.page, seo: { ...thankYouModel.page.seo, noindex: false } }
    expect(buildThankYouMetadata(page, thankYouModel.settings).robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it('has noindex content for the thank-you page at the source too', async () => {
    await models()
    expect(thankYouModel.page.seo.noindex).toBe(true)
  })
})
