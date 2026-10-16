import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { faqEntriesFromDto } from '@/components/sections/_internal/faq'
import { FaqSection } from '@/components/sections/faq-section'
import { publicFixtures } from '../fixtures/public'
import { criticalAxeViolations, stubMedia } from './sections-test-utils'

const home = publicFixtures.pages.home
const items = faqEntriesFromDto(
  publicFixtures.faq.filter((f) => f.tags.includes('home')).map((f) => f.item),
)

const props = {
  title: home.faq.title,
  intro: home.faq.intro,
  items,
  cta: { label: 'Talk to us', href: '/contact' },
}

beforeEach(() => stubMedia({}))

function jsonLdScripts(container: HTMLElement) {
  return container.querySelectorAll('script[type="application/ld+json"]')
}

describe('FaqSection layout and content', () => {
  it('renders the title, intro and CTA in the left column and the questions on the right', () => {
    const { container } = render(<FaqSection {...props} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(home.faq.title)
    expect(screen.getByText(home.faq.intro ?? '')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Talk to us' }).getAttribute('href')).toBe('/contact')
    expect(container.querySelector('[class*="lg:grid-cols-12"]')).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(items.length)
  })

  it('renders nothing for an empty list, including no JSON-LD', () => {
    const { container } = render(<FaqSection {...props} items={[]} jsonLd />)
    expect(container.firstChild).toBeNull()
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<FaqSection {...props} jsonLd />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('FaqSection accordion (components.md section 7)', () => {
  it('starts with every item closed and wires aria-expanded to aria-controls', () => {
    render(<FaqSection {...props} />)
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('aria-expanded')).toBe('false')
      const panelId = button.getAttribute('aria-controls') as string
      const panel = document.getElementById(panelId) as HTMLElement
      expect(panel).toBeTruthy()
      expect(panel.getAttribute('role')).toBe('region')
      expect(panel.getAttribute('aria-labelledby')).toBe(button.id)
    }
  })

  it('opens and closes with the mouse and keeps aria-expanded in step', async () => {
    const user = userEvent.setup()
    render(<FaqSection {...props} />)
    const first = screen.getAllByRole('button')[0] as HTMLElement
    await user.click(first)
    expect(first.getAttribute('aria-expanded')).toBe('true')
    await user.click(first)
    expect(first.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens and closes with Enter and Space', async () => {
    const user = userEvent.setup()
    render(<FaqSection {...props} />)
    const first = screen.getAllByRole('button')[0] as HTMLElement
    first.focus()
    await user.keyboard('{Enter}')
    expect(first.getAttribute('aria-expanded')).toBe('true')
    await user.keyboard(' ')
    expect(first.getAttribute('aria-expanded')).toBe('false')
  })

  it('lets several items stay open at once', async () => {
    const user = userEvent.setup()
    render(<FaqSection {...props} />)
    const [a, b] = screen.getAllByRole('button') as HTMLElement[]
    await user.click(a!)
    await user.click(b!)
    expect(a!.getAttribute('aria-expanded')).toBe('true')
    expect(b!.getAttribute('aria-expanded')).toBe('true')
  })

  it('moves focus between questions with the arrow keys, Home and End', async () => {
    const user = userEvent.setup()
    render(<FaqSection {...props} />)
    const buttons = screen.getAllByRole('button') as HTMLElement[]
    buttons[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(buttons[1])
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(buttons.at(-1))
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(buttons[0])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(buttons.at(-1))
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(buttons[0])
  })

  it('takes closed answers out of the tab order and the accessibility tree once hydrated', async () => {
    const user = userEvent.setup()
    render(<FaqSection {...props} />)
    const first = screen.getAllByRole('button')[0] as HTMLElement
    const panel = document.getElementById(first.getAttribute('aria-controls') as string)!
    expect(panel.hasAttribute('inert')).toBe(true)
    await user.click(first)
    expect(panel.hasAttribute('inert')).toBe(false)
  })

  it('renders the answer text from props', () => {
    render(<FaqSection {...props} />)
    expect(screen.getByText(items[0]!.answerText)).toBeTruthy()
  })

  it('makes the trigger at least 44 px tall with a visible focus ring', () => {
    render(<FaqSection {...props} />)
    const button = screen.getAllByRole('button')[0] as HTMLElement
    expect(button.className).toContain('min-h-11')
    expect(button.className).toContain('focus-visible:outline-focus')
  })

  it('names each region after its question', () => {
    render(<FaqSection {...props} />)
    const region = screen.getAllByRole('region', { hidden: true })[0] as HTMLElement
    expect(within(region).getByText(items[0]!.answerText)).toBeTruthy()
  })
})

describe('FaqSection JSON-LD', () => {
  it('is absent by default', () => {
    const { container } = render(<FaqSection {...props} />)
    expect(jsonLdScripts(container)).toHaveLength(0)
  })

  it('is a single valid FAQPage script when the option is on', () => {
    const { container } = render(<FaqSection {...props} jsonLd />)
    const scripts = jsonLdScripts(container)
    expect(scripts).toHaveLength(1)
    const data = JSON.parse(scripts[0]!.textContent ?? '')
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(items.length)
    expect(data.mainEntity[0].name).toBe(items[0]!.question)
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(items[0]!.answerText)
  })
})
