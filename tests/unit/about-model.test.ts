import { describe, expect, it, vi } from 'vitest'
import { checkSectionTones } from '@/components/sections'
import {
  ABOUT_HREFS,
  loadAboutModel,
  planAboutSections,
  storyBlocks,
  type AboutModel,
} from '@/components/pages/about/about-model'
import { buildAboutMetadata } from '@/components/pages/about/about-metadata'
import { aboutLabelsFromMessages } from '@/components/pages/about/about-labels'
import type { PublicContentSource } from '@/features/content/public'
import type { RichTextDocument } from '@/features/content/types'
import { createStaticContentSource } from '../../src/content/static'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import en from '../../messages/en.json'
import { publicFixtures } from '../fixtures/public'

const ids = (model: AboutModel) => planAboutSections(model).map((s) => s.id)

async function fixtureModel(): Promise<AboutModel> {
  return (await loadAboutModel(createFixtureContentSource(), 'en'))!
}

function withTeamToggles(
  model: AboutModel,
  { page, setting }: { page: boolean; setting: boolean },
): AboutModel {
  return {
    ...model,
    page: { ...model.page, team: { ...model.page.team, visible: page } },
    settings: {
      ...model.settings!,
      features: { ...model.settings!.features, showTeam: setting },
    },
  }
}

describe('loadAboutModel', () => {
  it('reads the about page, settings and team through the content contract', async () => {
    const model = await fixtureModel()
    expect(model.page.key).toBe('about')
    expect(model.settings?.locale).toBe('en')
    expect(model.team.map((m) => m.name)).toEqual(publicFixtures.team.map((m) => m.name))
  })

  it('resolves to null when the page has no content for the locale', async () => {
    const source = createFixtureContentSource()
    expect(await loadAboutModel(source, 'id' as never)).toBeNull()
  })

  it('does not even query the team while the page toggle is off', async () => {
    const base = createFixtureContentSource()
    const listTeam = vi.fn(base.listTeam)
    const source: PublicContentSource = {
      ...base,
      listTeam,
      getPage: async (key, locale) => {
        const page = await base.getPage(key, locale)
        return key === 'about' && page
          ? ({ ...page, team: { ...(page as { team: object }).team, visible: false } } as never)
          : page
      },
    }
    const model = await loadAboutModel(source, 'en')
    expect(listTeam).not.toHaveBeenCalled()
    expect(model?.team).toEqual([])
  })

  it('does not query the team when the site setting is off', async () => {
    const base = createFixtureContentSource()
    const listTeam = vi.fn(base.listTeam)
    const source: PublicContentSource = {
      ...base,
      listTeam,
      getSiteSettings: async (locale) => {
        const settings = await base.getSiteSettings(locale)
        return settings
          ? { ...settings, features: { ...settings.features, showTeam: false } }
          : settings
      },
    }
    const model = await loadAboutModel(source, 'en')
    expect(listTeam).not.toHaveBeenCalled()
    expect(model?.team).toEqual([])
  })

  it('serves the static launch content: showTeam is off and no one is listed', async () => {
    const model = (await loadAboutModel(createStaticContentSource(), 'en'))!
    expect(model.settings?.features.showTeam).toBe(false)
    expect(model.team).toEqual([])
    expect(ids(model)).not.toContain('team')
  })
})

describe('planAboutSections', () => {
  it('follows page-patterns 2.7 and puts the team before the final CTA', async () => {
    const model = withTeamToggles(await fixtureModel(), { page: true, setting: true })
    expect(ids(model)).toEqual([
      'hero',
      'story',
      'mission',
      'values',
      'meetSino',
      'team',
      'finalCta',
    ])
  })

  it.each([
    ['page toggle off', { page: false, setting: true }],
    ['site setting off', { page: true, setting: false }],
    ['both off', { page: false, setting: false }],
  ])('hides the team with the %s', async (_label, toggles) => {
    const model = withTeamToggles(await fixtureModel(), toggles)
    expect(ids(model)).not.toContain('team')
  })

  it('hides the team when both toggles are on but nobody is listed', async () => {
    const model = withTeamToggles(
      { ...(await fixtureModel()), team: [] },
      { page: true, setting: true },
    )
    expect(ids(model)).not.toContain('team')
  })

  it('treats missing site settings as the team switched off', async () => {
    const model = { ...(await fixtureModel()), settings: null }
    expect(ids(model)).not.toContain('team')
  })

  it('hides values without items and a story without text', async () => {
    const base = await fixtureModel()
    const empty: RichTextDocument = { type: 'doc', content: [] }
    const model: AboutModel = {
      ...base,
      page: { ...base.page, story: empty, values: { ...base.page.values, items: [] } },
    }
    expect(ids(withTeamToggles(model, { page: false, setting: false }))).toEqual([
      'hero',
      'mission',
      'meetSino',
      'finalCta',
    ])
  })

  it('assigns tones that pass the layout rules, with and without the team', async () => {
    for (const toggles of [
      { page: true, setting: true },
      { page: false, setting: false },
    ]) {
      const model = withTeamToggles(await fixtureModel(), toggles)
      const tones = planAboutSections(model).map((s) => s.tone)
      expect(checkSectionTones(tones)).toEqual([])
      expect(tones[0]).toBe('aurora')
      expect(tones.at(-1)).toBe('inverse')
      expect(tones.filter((t) => t === 'inverse')).toHaveLength(1)
    }
  })

  it('keeps tones valid when hidden sections would have made two bands touch', async () => {
    const base = withTeamToggles(await fixtureModel(), { page: true, setting: true })
    // Without values, mission and Meet Sino become neighbours and must not share a tone.
    const model: AboutModel = {
      ...base,
      page: { ...base.page, values: { ...base.page.values, items: [] } },
    }
    const tones = planAboutSections(model).map((s) => s.tone)
    expect(checkSectionTones(tones)).toEqual([])
  })
})

describe('storyBlocks', () => {
  it('turns the rich text story into headings and plain paragraphs', () => {
    const blocks = storyBlocks(publicFixtures.pages.about.story)
    expect(blocks[0]).toEqual({ kind: 'heading', text: 'Our story', level: 2 })
    expect(blocks.slice(1).every((b) => b.kind === 'paragraph' && b.text.length > 0)).toBe(true)
  })

  it('flattens marks, lists and unknown nodes to their text and drops empty ones', () => {
    const item = (text: string) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    })
    const document: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Plain and ' },
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
          ],
        },
        { type: 'bulletList', content: [item('One'), item('Two')] },
        { type: 'paragraph', content: [] },
      ],
    }
    expect(storyBlocks(document)).toEqual([
      { kind: 'paragraph', text: 'Plain and bold' },
      { kind: 'paragraph', text: 'One' },
      { kind: 'paragraph', text: 'Two' },
    ])
  })
})

describe('about links', () => {
  it('sends the final CTA to the contact page', () => {
    expect(ABOUT_HREFS.contact).toBe('/contact')
  })
})

describe('buildAboutMetadata', () => {
  const { about } = publicFixtures.pages
  const settings = publicFixtures.siteSettings

  it('takes title, description and canonical from the page SEO fields', () => {
    const meta = buildAboutMetadata(about, settings)
    expect(meta.title).toEqual({ absolute: about.seo.metaTitle })
    expect(meta.description).toBe(about.seo.metaDescription)
    expect(meta.alternates?.canonical).toBe('/about')
    expect(meta.openGraph).toMatchObject({ title: about.seo.metaTitle, url: '/about' })
  })

  it('honours the editor canonical and noindex, and the default OG image fallback', () => {
    const custom = buildAboutMetadata(
      { ...about, seo: { ...about.seo, canonicalUrl: '/company', noindex: true } },
      settings,
    )
    expect(custom.alternates?.canonical).toBe('/company')
    expect(custom.robots).toEqual({ index: false, follow: false })
    const meta = buildAboutMetadata(about, settings)
    expect(meta.robots).toBeUndefined()
    const images = (meta.openGraph as { images?: { url: string }[] }).images
    expect(images?.[0]?.url).toBe(settings.brand.defaultOgImage?.url)
  })

  it('works without site settings', () => {
    expect(buildAboutMetadata(about, null).title).toEqual({ absolute: about.seo.metaTitle })
  })
})

describe('aboutLabelsFromMessages', () => {
  it('reads the WhatsApp label from the messages', () => {
    expect(aboutLabelsFromMessages(en).chatOnWhatsapp).toBe(en.Nav.chatOnWhatsapp)
  })

  it('yields no labels for anything unexpected instead of a raw key', () => {
    expect(aboutLabelsFromMessages(undefined)).toEqual({})
    expect(aboutLabelsFromMessages({ Nav: { chatOnWhatsapp: '' } })).toEqual({})
  })
})
