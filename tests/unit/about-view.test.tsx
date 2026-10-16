import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AboutView, type AboutViewProps } from '@/components/pages/about/about-view'
import {
  loadAboutModel,
  planAboutSections,
  type AboutModel,
} from '@/components/pages/about/about-model'
import { checkSectionTones } from '@/components/sections'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import { publicFixtures } from '../fixtures/public'
import { installIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, image, stubMedia } from './sections-test-utils'

const labels = { chatOnWhatsapp: 'Chat on WhatsApp' }

let base: AboutModel

/** Both team toggles on, with local images so next/image never touches the placeholder host. */
function withTeam(model: AboutModel, team = model.team): AboutModel {
  return {
    ...model,
    page: { ...model.page, team: { ...model.page.team, visible: true } },
    settings: { ...model.settings!, features: { ...model.settings!.features, showTeam: true } },
    team,
  }
}

function withoutTeam(model: AboutModel): AboutModel {
  return {
    ...model,
    page: { ...model.page, team: { ...model.page.team, visible: false } },
  }
}

function renderAbout(model: AboutModel, props: Partial<AboutViewProps> = {}) {
  return render(<AboutView model={model} labels={labels} {...props} />)
}

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-about-section]'))
const sectionIds = () => sections().map((el) => el.dataset.aboutSection)
const section = (id: string) => document.querySelector<HTMLElement>(`[data-about-section="${id}"]`)!

beforeEach(async () => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  const loaded = (await loadAboutModel(createFixtureContentSource(), 'en'))!
  base = {
    ...loaded,
    page: {
      ...loaded.page,
      hero: { ...loaded.page.hero, scene: image('Sino and two colleagues at a table', 1600, 1200) },
    },
    team: publicFixtures.team.map((member) => ({
      ...member,
      photo: member.photo ? image(member.photo.alt, 800, 800) : null,
    })),
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('About composition', () => {
  it('renders the sections in the order of page-patterns 2.7', () => {
    renderAbout(withTeam(base))
    expect(sectionIds()).toEqual([
      'hero',
      'story',
      'mission',
      'values',
      'meetSino',
      'team',
      'finalCta',
    ])
  })

  it('renders exactly the plan: view and plan cannot drift apart', () => {
    const model = withTeam(base)
    renderAbout(model)
    expect(sectionIds()).toEqual(planAboutSections(model).map((s) => s.id))
  })

  it('puts the planned tone on each band and passes the tone rules', () => {
    const model = withTeam(base)
    renderAbout(model)
    const tones = sections().map((el) => el.dataset.aboutTone)
    expect(tones).toEqual(planAboutSections(model).map((s) => s.tone))
    expect(checkSectionTones(tones as never)).toEqual([])
    expect(document.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })

  it('has one main landmark with the skip-link id, focusable, and one h1 from the content', () => {
    renderAbout(withTeam(base))
    const mains = document.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe('main-content')
    expect(mains[0]!.getAttribute('tabindex')).toBe('-1')
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]!.textContent).toBe(base.page.hero.title)
    expect(section('hero').contains(h1[0]!)).toBe(true)
  })

  it('titles each section with its content heading', () => {
    renderAbout(withTeam(base))
    const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2).toEqual([
      'Our story',
      base.page.mission.title,
      base.page.values.title,
      base.page.meetSino.title,
      base.page.team.title,
      base.page.finalCta.headline,
    ])
  })
})

describe('About hero', () => {
  it('has no eyebrow and shows the lead from the content', () => {
    renderAbout(base)
    const hero = section('hero')
    expect(within(hero).getByText(base.page.hero.lead)).toBeTruthy()
    expect(hero.querySelector('.text-eyebrow')).toBeNull()
  })

  it('draws the scene from the content as a Sino still, with no realtime canvas', () => {
    renderAbout(base)
    const hero = section('hero')
    expect(hero.querySelector('[data-animated-pose]')).toBeTruthy()
    expect(within(hero).getByAltText(base.page.hero.scene!.alt)).toBeTruthy()
    expect(hero.querySelector('canvas, [data-slot="sino-canvas"]')).toBeNull()
  })

  it('falls back to the S13 pose when the scene is not produced yet', () => {
    renderAbout({ ...base, page: { ...base.page, hero: { ...base.page.hero, scene: null } } })
    const img = section('hero').querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toContain('sino-relaxed')
  })

  it('has no call to action of its own: the content holds no hero label', () => {
    renderAbout(base)
    expect(within(section('hero')).queryAllByRole('link')).toHaveLength(0)
  })
})

describe('About story, mission and values', () => {
  it('renders the story paragraphs from the content under its own heading', () => {
    renderAbout(base)
    const story = section('story')
    expect(within(story).getByRole('heading', { level: 2 }).textContent).toBe('Our story')
    const paragraphs = Array.from(story.querySelectorAll('p')).map((p) => p.textContent)
    expect(paragraphs).toEqual([
      'We started Sineva to make AI useful for people who run businesses, not only for engineers.',
      'We build and teach with real work, so the result is something your team can use.',
    ])
  })

  it('shows the mission as one statement card', () => {
    renderAbout(base)
    const mission = section('mission')
    expect(within(mission).getByText(base.page.mission.body)).toBeTruthy()
    expect(mission.querySelectorAll('[data-variant]')).toHaveLength(1)
  })

  it('renders one card per value with its title and body', () => {
    renderAbout(base)
    const cards = section('values').querySelectorAll<HTMLElement>('[data-variant="feature"]')
    expect(cards).toHaveLength(base.page.values.items.length)
    base.page.values.items.forEach((item, index) => {
      const card = cards[index]!
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(item.title)
      expect(within(card).getByText(item.body)).toBeTruthy()
    })
  })
})

describe('About Meet Sino', () => {
  it('shows what the mascot stands for with a decorative pose', () => {
    renderAbout(base)
    const meet = section('meetSino')
    expect(within(meet).getByText(base.page.meetSino.body)).toBeTruthy()
    expect(meet.querySelector('[data-animated-pose]')).toBeTruthy()
    // Decorative: the text beside it carries the meaning, so the alt is empty.
    expect(meet.querySelector('img')!.getAttribute('alt')).toBe('')
  })

  it('draws a different pose than the hero, so the page does not repeat one picture', () => {
    renderAbout(base)
    const src = (id: string) => section(id).querySelector('img')!.getAttribute('src')
    expect(src('meetSino')).not.toBe(src('hero'))
  })
})

describe('About team', () => {
  it('renders one card per member with name and role, in order', () => {
    renderAbout(withTeam(base))
    const cards = section('team').querySelectorAll<HTMLElement>('[data-team-member]')
    expect(cards).toHaveLength(base.team.length)
    base.team.forEach((member, index) => {
      const card = cards[index]!
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBe(member.name)
      expect(within(card).getByText(member.role)).toBeTruthy()
      if (member.bio) expect(within(card).getByText(member.bio)).toBeTruthy()
    })
  })

  it('shows a photo with its alt from Media, and a fallback without a photo', () => {
    renderAbout(withTeam(base))
    const cards = section('team').querySelectorAll<HTMLElement>('[data-team-member]')
    const withPhoto = base.team.findIndex((m) => m.photo)
    expect(within(cards[withPhoto]!).getByAltText(base.team[withPhoto]!.photo!.alt)).toBeTruthy()

    const noPhoto = base.team.findIndex((m) => !m.photo)
    const fallback = cards[noPhoto]!
    expect(fallback.querySelector('img')).toBeNull()
    // The initials are decorative: the name next to them is the accessible text.
    const initials = fallback.querySelector('[data-team-fallback]')!
    expect(initials.getAttribute('aria-hidden')).toBe('true')
    expect(initials.textContent).toBe('SD')
  })

  it('omits the bio line for a member without one', () => {
    renderAbout(withTeam(base))
    const sari = Array.from(
      section('team').querySelectorAll<HTMLElement>('[data-team-member]'),
    ).find((card) => within(card).queryByText('Sari Demo'))!
    expect(sari.querySelectorAll('p')).toHaveLength(1)
  })

  it('disappears when the page toggle is off', () => {
    renderAbout(withoutTeam(withTeam(base)))
    expect(sectionIds()).not.toContain('team')
  })

  it('disappears when the site setting is off', () => {
    const model = withTeam(base)
    renderAbout({
      ...model,
      settings: { ...model.settings!, features: { ...model.settings!.features, showTeam: false } },
    })
    expect(sectionIds()).not.toContain('team')
    expect(screen.queryByText(base.page.team.title)).toBeNull()
    expect(screen.queryByText(base.team[0]!.name)).toBeNull()
  })

  it('disappears when the toggles are on but the list is empty', () => {
    renderAbout(withTeam(base, []))
    expect(sectionIds()).not.toContain('team')
    expect(screen.queryByText(base.page.team.title)).toBeNull()
  })
})

describe('About final CTA', () => {
  it('uses the content headline, body and label, and sends the CTA to /contact', () => {
    renderAbout(base)
    const cta = section('finalCta')
    expect(within(cta).getByRole('heading', { level: 2 }).textContent).toBe(
      base.page.finalCta.headline,
    )
    expect(within(cta).getByText(base.page.finalCta.body)).toBeTruthy()
    expect(
      within(cta)
        .getByRole('link', { name: base.page.finalCta.primaryCtaLabel })
        .getAttribute('href'),
    ).toBe('/contact')
  })

  it('shows a second CTA to the product page only when the content has a label for it', () => {
    const { unmount } = renderAbout(base)
    expect(
      within(section('finalCta')).queryByRole('link', { name: 'Join the waitlist' }),
    ).toBeNull()
    unmount()

    renderAbout({
      ...base,
      page: {
        ...base.page,
        finalCta: { ...base.page.finalCta, secondaryCtaLabel: 'Join the waitlist' },
      },
    })
    expect(
      within(section('finalCta'))
        .getByRole('link', { name: 'Join the waitlist' })
        .getAttribute('href'),
    ).toBe('/products/ai-agents')
  })

  it('adds the WhatsApp action from the settings and drops it without a usable number', () => {
    const { unmount } = renderAbout(base)
    const link = within(section('finalCta')).getByRole('link', { name: labels.chatOnWhatsapp })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\//)
    unmount()

    renderAbout({ ...base, settings: null })
    expect(
      within(section('finalCta')).queryByRole('link', { name: labels.chatOnWhatsapp }),
    ).toBeNull()
  })

  it('drops the WhatsApp action without its label', () => {
    renderAbout(base, { labels: {} })
    expect(within(section('finalCta')).queryByRole('link', { name: /whatsapp/i })).toBeNull()
  })
})

describe('About page quality', () => {
  it('has no critical or serious accessibility violation', async () => {
    const { container } = renderAbout(withTeam(base))
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('does not emit structured data: Organization JSON-LD is another ticket', () => {
    renderAbout(withTeam(base))
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0)
  })

  it('renders with the static launch content (no team, no scene problems)', async () => {
    const { createStaticContentSource } = await import('../../src/content/static')
    const model = (await loadAboutModel(createStaticContentSource(), 'en'))!
    renderAbout(model)
    expect(sectionIds()).toEqual(['hero', 'story', 'mission', 'values', 'meetSino', 'finalCta'])
  })
})
