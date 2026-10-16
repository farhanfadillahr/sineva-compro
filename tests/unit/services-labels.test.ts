import { describe, expect, it } from 'vitest'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { validatePublicCopy } from '../../src/lib/copy'
import en from '../../messages/en.json'

describe('Services labels in messages/en.json', () => {
  const labels = servicesLabelsFromMessages(en)

  it('reads every label the Services pages need', () => {
    expect(labels.breadcrumbLabel).toBe('Breadcrumb')
    expect(labels.homeCrumb).toBe(en.Pages.home)
    expect(labels.servicesCrumb).toBe(en.Pages.services)
    expect(labels.cardCta('AI Build')).toBe('Explore AI Build')
    expect(labels.detail.problemsTitle).toBeTruthy()
    expect(labels.detail.deliverablesTitle).toBeTruthy()
    expect(labels.detail.toolsTitle).toBeTruthy()
  })

  it('follows the copy rules (no dash, no trailing full stop on labels)', () => {
    const flat = [
      labels.breadcrumbLabel,
      labels.stickyBarLabel,
      labels.chatOnWhatsapp,
      labels.internalDemo,
      labels.cardCta('X'),
      ...Object.values(labels.detail),
    ]
    for (const value of flat) expect(validatePublicCopy(value).ok, value).toBe(true)
  })

  it('fails loudly on a missing label instead of showing a raw key', () => {
    expect(() => servicesLabelsFromMessages({})).toThrow(/Services/)
    expect(() => servicesLabelsFromMessages({ Pages: en.Pages, Services: {} })).toThrow(
      /breadcrumbLabel/,
    )
  })
})
