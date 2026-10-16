import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JourneySteps } from '@/components/sections/journey-steps'
import { processSteps } from '@/content/static/services'

describe('illustrated working journey', () => {
  it('keeps the content order and uses an accessible heading for every step', () => {
    const { container } = render(<JourneySteps title="How we work" steps={processSteps} />)
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      processSteps.map((step) => step.title),
    )
    expect(container.querySelectorAll('img')).toHaveLength(4)
    expect(screen.queryByRole('tablist')).toBeNull()
    for (const step of processSteps) expect(screen.getByText(step.body)).not.toBeNull()
  })
  it('has no motion requirement for reading all four steps', () => {
    const { container } = render(<JourneySteps title="How we work" steps={processSteps} />)
    expect(container.querySelector('[data-slot="journey-steps"]')?.textContent).toContain(
      processSteps[3]!.body,
    )
    expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
  })
  it('omits an empty section', () => {
    const { container } = render(<JourneySteps title="How we work" steps={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
