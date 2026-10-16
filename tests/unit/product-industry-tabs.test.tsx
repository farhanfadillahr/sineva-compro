import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { IndustryTabs } from '@/components/pages/product/industry-tabs'
import { staticContent } from '../../src/content/static'
import { criticalAxeViolations, stubMedia } from './sections-test-utils'

const items = staticContent.industries
const LABEL = 'Business type'

beforeEach(() => {
  stubMedia({})
})

const tabs = () => screen.getAllByRole('tab')

describe('IndustryTabs structure (ARIA tabs pattern)', () => {
  it('is a named tablist with one tab per industry, in order', () => {
    render(<IndustryTabs label={LABEL} items={items} />)
    expect(screen.getByRole('tablist', { name: LABEL })).toBeTruthy()
    expect(tabs().map((tab) => tab.textContent)).toEqual(items.map((item) => item.label))
  })

  it('selects the first tab by default and shows its example day in the one visible panel', () => {
    render(<IndustryTabs label={LABEL} items={items} />)
    expect(tabs().map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ])
    const panel = screen.getByRole('tabpanel')
    expect(panel.textContent).toContain(items[0]!.exampleDay)
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[0]!.id)
    expect(tabs()[0]!.getAttribute('aria-controls')).toBe(panel.id)
  })

  it('uses a roving tabindex: only the selected tab is in the tab order', () => {
    render(<IndustryTabs label={LABEL} items={items} />)
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1, -1])
  })

  it('keeps every panel in the document (hidden), each wired to its tab', () => {
    render(<IndustryTabs label={LABEL} items={items} />)
    const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]')
    expect(panels).toHaveLength(items.length)
    panels.forEach((panel, index) => {
      expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[index]!.id)
      expect(tabs()[index]!.getAttribute('aria-controls')).toBe(panel.id)
      expect(panel.hidden).toBe(index !== 0)
    })
  })

  it('renders nothing for an empty list, never a lone empty tablist', () => {
    const { container } = render(<IndustryTabs label={LABEL} items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('has no critical or serious accessibility violations', async () => {
    const { container } = render(<IndustryTabs label={LABEL} items={items} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('IndustryTabs keyboard', () => {
  it('moves focus and selection with ArrowRight and wraps from the last to the first', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tabs()[1])
    expect(tabs()[1]!.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain(items[1]!.exampleDay)
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toBe(tabs()[0])
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('moves back with ArrowLeft and wraps from the first to the last', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(tabs()[2])
    expect(tabs()[2]!.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain(items[2]!.exampleDay)
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(tabs()[2])
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(tabs()[0])
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('updates the roving tabindex with the selection', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([-1, 0, -1])
  })

  it('ignores other keys', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.keyboard('a{ArrowDown}')
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true')
  })

  it('selects a tab on click and shows its panel', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    await user.click(tabs()[2]!)
    expect(tabs()[2]!.getAttribute('aria-selected')).toBe('true')
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('tabpanel').textContent).toContain(items[2]!.exampleDay)
  })

  it('lets Tab leave the tablist into the panel, not through every tab', async () => {
    const user = userEvent.setup()
    render(<IndustryTabs label={LABEL} items={items} />)
    tabs()[0]!.focus()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('tabpanel'))
  })
})
