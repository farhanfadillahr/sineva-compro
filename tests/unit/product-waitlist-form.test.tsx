import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WaitlistForm, type WaitlistFormProps } from '@/components/pages/product/waitlist-form'
import type { ProductLabels } from '@/components/pages/product/product-labels'
import { buildWaitlistWhatsAppUrl } from '@/components/pages/product/waitlist-message'
import { criticalAxeViolations } from './sections-test-utils'

const labels: ProductLabels['waitlist'] = {
  formLabel: 'Get notified about Sino',
  nameLabel: 'Name (optional)',
  businessTypeLabel: 'Business type (optional)',
  businessTypePlaceholder: 'Choose one',
  consentBefore: 'I agree that Sineva can contact me about Sino. Read the ',
  consentLink: 'privacy policy',
  consentAfter: '.',
  consentError: 'Tick the box so we know you are happy to be contacted.',
  helper: 'This opens WhatsApp with your message ready to send. Nothing is saved on this site.',
  emailButton: 'Send by email instead',
  openedMessage: 'WhatsApp should open in a new tab. If it did not, use the link.',
  openedLink: 'Open WhatsApp',
  messageNotify: 'Please let me know when Sino is ready.',
  messageName: 'Name',
  messageBusinessType: 'Business type',
  emailSubject: 'Notify me about Sino',
}

const props: WaitlistFormProps = {
  labels,
  submitLabel: 'Get notified',
  businessTypes: [
    { key: 'online-shop', label: 'Online shop' },
    { key: 'cafe-and-restaurant', label: 'Cafe and restaurant' },
  ],
  channels: {
    whatsappNumber: '+6285199368510',
    email: null,
    greeting: "Hi Sineva, I'd like to know more about Sineva AI Agents.",
  },
  privacyHref: '/privacy-policy',
}

const copy = {
  notify: labels.messageNotify,
  name: labels.messageName,
  businessType: labels.messageBusinessType,
  emailSubject: labels.emailSubject,
}

const open = vi.fn()
const fetchSpy = vi.fn()

beforeEach(() => {
  vi.stubGlobal('open', open)
  vi.stubGlobal('fetch', fetchSpy)
  open.mockReturnValue(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const submit = () => screen.getByRole('button', { name: 'Get notified' })
const consent = () => screen.getByRole('checkbox')

describe('WaitlistForm fields', () => {
  it('is a named form with an optional name, an optional business type and a required consent', () => {
    render(<WaitlistForm {...props} />)
    expect(screen.getByRole('form', { name: labels.formLabel })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: labels.nameLabel })).toBeTruthy()
    const select = screen.getByRole('combobox', { name: labels.businessTypeLabel })
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([labels.businessTypePlaceholder, 'Online shop', 'Cafe and restaurant'])
    expect(consent().getAttribute('aria-required')).toBe('true')
    expect(screen.getByRole('link', { name: labels.consentLink }).getAttribute('href')).toBe(
      '/privacy-policy',
    )
    expect(submit()).toBeTruthy()
  })

  it('explains what submitting does, honestly', () => {
    render(<WaitlistForm {...props} />)
    expect(screen.getByText(labels.helper)).toBeTruthy()
  })

  it('renders nothing when neither WhatsApp nor email can receive the message', () => {
    const { container } = render(
      <WaitlistForm {...props} channels={{ ...props.channels, whatsappNumber: null }} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('has no critical or serious accessibility violations', async () => {
    const { container } = render(<WaitlistForm {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('WaitlistForm does not post anywhere', () => {
  it('has no action and no POST method, so nothing can reach a server', () => {
    render(<WaitlistForm {...props} />)
    const form = screen.getByRole('form') as HTMLFormElement
    expect(form.hasAttribute('action')).toBe(false)
    expect((form.getAttribute('method') ?? 'get').toLowerCase()).not.toBe('post')
    expect(form.hasAttribute('enctype')).toBe(false)
  })

  it('prevents the native submit and never calls fetch', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.type(screen.getByRole('textbox', { name: labels.nameLabel }), 'Rina')
    await user.click(consent())
    const event = new Event('submit', { bubbles: true, cancelable: true })
    screen.getByRole('form').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await user.click(submit())
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('puts no name attributes on the controls: without JavaScript a native GET would leak nothing', () => {
    render(<WaitlistForm {...props} />)
    const form = screen.getByRole('form') as HTMLFormElement
    for (const control of Array.from(form.elements)) {
      expect(control.getAttribute('name'), control.outerHTML).toBeNull()
    }
  })
})

describe('WaitlistForm consent is required', () => {
  it('shows an accessible error, opens nothing and focuses the checkbox when consent is missing', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.click(submit())
    expect(open).not.toHaveBeenCalled()
    const error = screen.getByText(labels.consentError)
    expect(error.closest('[data-slot="error"]')).toBeTruthy()
    expect(consent().getAttribute('aria-invalid')).toBe('true')
    expect(consent().getAttribute('aria-describedby')).toContain(
      error.closest('[data-slot="error"]')!.id,
    )
    expect(document.activeElement).toBe(consent())
  })

  it('clears the error once consent is given and then submits', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.click(submit())
    await user.click(consent())
    expect(screen.queryByText(labels.consentError)).toBeNull()
    expect(consent().getAttribute('aria-invalid')).toBeNull()
    await user.click(submit())
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('does not validate the optional fields', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.click(consent())
    await user.click(submit())
    expect(open).toHaveBeenCalledTimes(1)
  })
})

describe('WaitlistForm opens WhatsApp', () => {
  it('opens the prefilled wa.me link in a new tab with noopener', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.type(screen.getByRole('textbox', { name: labels.nameLabel }), 'Rina')
    await user.selectOptions(
      screen.getByRole('combobox', { name: labels.businessTypeLabel }),
      'Online shop',
    )
    await user.click(consent())
    await user.click(submit())
    const expected = buildWaitlistWhatsAppUrl(
      { name: 'Rina', businessType: 'Online shop' },
      copy,
      props.channels,
    )!
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(expected, '_blank', 'noopener,noreferrer')
    expect(expected.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    const text = decodeURIComponent(expected.split('?text=')[1]!)
    expect(text).toContain("Hi Sineva, I'd like to know more about Sineva AI Agents.")
    expect(text).toContain('Name: Rina')
    expect(text).toContain('Business type: Online shop')
  })

  it('submits with the Enter key from the name field', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.click(consent())
    await user.type(screen.getByRole('textbox', { name: labels.nameLabel }), 'Rina{Enter}')
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('shows a status with a plain link to the same URL in case the pop-up was blocked', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...props} />)
    await user.click(consent())
    await user.click(submit())
    const status = screen.getByRole('status')
    expect(status.textContent).toContain(labels.openedMessage)
    const link = within(status).getByRole('link', { name: labels.openedLink })
    expect(link.getAttribute('href')).toBe(open.mock.calls[0]![0])
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('shows no status before the first submit', () => {
    render(<WaitlistForm {...props} />)
    expect(screen.queryByRole('status')?.textContent ?? '').toBe('')
  })
})

describe('WaitlistForm email route', () => {
  const withEmail = { ...props, channels: { ...props.channels, email: 'hello@example.com' } }

  it('has no email button while no email exists', () => {
    render(<WaitlistForm {...props} />)
    expect(screen.queryByRole('button', { name: labels.emailButton })).toBeNull()
  })

  it('offers an email button when an email exists, with the same consent rule', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm {...withEmail} />)
    await user.click(screen.getByRole('button', { name: labels.emailButton }))
    expect(open).not.toHaveBeenCalled()
    expect(screen.getByText(labels.consentError)).toBeTruthy()
    await user.click(consent())
    await user.click(screen.getByRole('button', { name: labels.emailButton }))
    expect(open).toHaveBeenCalledTimes(1)
    const [url, target] = open.mock.calls[0]!
    expect((url as string).startsWith('mailto:hello@example.com?subject=')).toBe(true)
    expect(target).toBe('_self')
  })

  it('still works by email when there is no WhatsApp number', async () => {
    const user = userEvent.setup()
    render(
      <WaitlistForm {...withEmail} channels={{ ...withEmail.channels, whatsappNumber: null }} />,
    )
    expect(screen.queryByRole('button', { name: 'Get notified' })).toBeNull()
    await user.click(consent())
    await user.click(screen.getByRole('button', { name: labels.emailButton }))
    expect(open).toHaveBeenCalledTimes(1)
  })
})
