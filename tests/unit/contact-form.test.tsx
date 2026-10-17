import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ContactForm,
  ContactFormWithPrefill,
  type ContactFormProps,
} from '@/components/pages/contact/contact-form'
import { siteSettings } from '../../src/content/static/site-settings'
import en from '../../messages/en.json'
import { criticalAxeViolations } from './sections-test-utils'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  search: { current: new URLSearchParams() },
  save: vi.fn(),
  turnstileReset: vi.fn(),
}))

vi.mock('@/i18n/navigation', async () => ({
  ...(await import('./layout-test-utils')).navigationMock,
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('next/navigation', () => ({ useSearchParams: () => mocks.search.current }))

const consentLabel = {
  before: 'I agree that Sineva stores these details to reply to me, as explained in the ',
  linkLabel: 'privacy policy',
  after: '.',
}

const baseProps: ContactFormProps = {
  intro: 'Tell us a little about your business.',
  consentLabel,
  settings: { contact: siteSettings.contact, whatsapp: siteSettings.whatsapp },
  // The `saveContact` server action, injected by the page (CPR-105).
  saveLead: (...args) => mocks.save(...args),
}

function renderForm(props: Partial<ContactFormProps> = {}, Component = ContactForm) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <Component {...baseProps} {...props} />
    </NextIntlClientProvider>,
  )
}

const field = (name: RegExp) => screen.getByLabelText(name)
const submit = () => screen.getByRole('button', { name: 'Send message' })

type User = ReturnType<typeof userEvent.setup>

async function fillValid(user: User) {
  await user.type(field(/^Name/), 'Rina Wijaya')
  await user.type(field(/^Work email/), 'rina@maju.co.id')
  await user.type(field(/^WhatsApp number/), '0812 3456 7890')
  await user.type(field(/^Company/), 'PT Maju')
  await user.selectOptions(field(/^Business type/), 'Startup')
  await user.selectOptions(field(/^What do you need help with/), 'AI Build')
  await user.selectOptions(field(/^Budget range/), 'IDR 10M to 50M')
  await user.type(field(/^Message/), 'We want an assistant that answers customer chats.')
  await user.click(screen.getByRole('checkbox'))
}

let open: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  mocks.search.current = new URLSearchParams()
  mocks.push.mockReset()
  mocks.save.mockReset().mockResolvedValue({ ok: true })
  mocks.turnstileReset.mockReset()
  // Turnstile passes at once, like Cloudflare's test key.
  window.turnstile = {
    render: (_box: HTMLElement, options: { callback: (token: string) => void }) => {
      options.callback('test-token')
      return 'widget'
    },
    reset: mocks.turnstileReset,
    remove: () => {},
  } as unknown as NonNullable<Window['turnstile']>
  // A real new window returns a handle; `opener` is what the form must clear.
  open = vi
    .spyOn(window, 'open')
    .mockImplementation(() => ({ opener: window }) as unknown as Window)
})

describe('form fields', () => {
  it('has the fields of page-patterns 2.8, with the work email and WhatsApp number to reply on', () => {
    renderForm()
    for (const label of [
      /^Name/,
      /^Work email/,
      /^WhatsApp number/,
      /^Company/,
      /^Business type/,
      /^What do you need help with/,
      /^Budget range/,
      /^Message/,
    ]) {
      expect(field(label)).toBeTruthy()
    }
    expect(screen.getByRole('checkbox')).toBeTruthy()
    expect(field(/^Work email/).getAttribute('autocomplete')).toBe('email')
    expect(field(/^WhatsApp number/).getAttribute('autocomplete')).toBe('tel')
    expect(field(/^WhatsApp number/).getAttribute('inputmode')).toBe('tel')
  })

  it('marks the required fields, with aria-required, and the optional ones in the label', () => {
    renderForm()
    for (const label of [
      /^Name/,
      /^Work email/,
      /^WhatsApp number/,
      /^Business type/,
      /^What do you need help with/,
      /^Message/,
    ]) {
      expect(field(label).getAttribute('aria-required')).toBe('true')
    }
    expect(screen.getByText('Company (optional)')).toBeTruthy()
    expect(screen.getByText('Budget range (optional)')).toBeTruthy()
  })

  it('offers the four business types and the five needs, in the builder values', () => {
    renderForm()
    const options = (label: RegExp) =>
      within(field(label))
        .getAllByRole('option')
        .map((o) => (o as HTMLOptionElement).value)
        .filter(Boolean)
    expect(options(/^Business type/)).toEqual(['Small business', 'Company', 'Startup', 'Other'])
    expect(options(/^What do you need help with/)).toEqual([
      'AI Discovery',
      'AI Build',
      'AI Enablement',
      'Sineva Product Suite',
      'Not sure yet',
    ])
  })

  it('writes the budget ranges with "to" and no dash', () => {
    renderForm()
    const labels = within(field(/^Budget range/))
      .getAllByRole('option')
      .map((o) => o.textContent ?? '')
    expect(labels).toContain('IDR 10M to 50M')
    expect(labels.join(' ')).not.toMatch(/[-–—]/)
  })

  it('sets autocomplete, length limits and text size for autofill and iOS', () => {
    renderForm()
    expect(field(/^Name/).getAttribute('autocomplete')).toBe('name')
    expect(field(/^Name/).getAttribute('maxlength')).toBe('80')
    expect(field(/^Company/).getAttribute('autocomplete')).toBe('organization')
    expect(field(/^Company/).getAttribute('maxlength')).toBe('120')
    expect(field(/^Message/).getAttribute('maxlength')).toBe('1000')
    // 16 px text (`text-base`) is what stops iOS Safari from zooming on focus.
    for (const label of [/^Name/, /^Company/, /^Business type/, /^Message/]) {
      expect(field(label).classList.contains('text-base')).toBe(true)
    }
  })

  it('links the consent to the privacy policy, in a new tab so the typed answers stay', () => {
    renderForm()
    const link = screen.getByRole('link', { name: 'privacy policy' })
    expect(link.getAttribute('href')).toBe('/privacy-policy')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('labels the submit button "Send message"', () => {
    renderForm()
    expect(submit().getAttribute('type')).toBe('submit')
  })

  it('has no critical accessibility violation, empty and with errors', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()
    expect(await criticalAxeViolations(container)).toEqual([])
    await user.click(submit())
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('prefill from ?service=', () => {
  it('preselects AI Build for ?service=ai-build', () => {
    mocks.search.current = new URLSearchParams('service=ai-build')
    renderForm({}, ContactFormWithPrefill)
    expect((field(/^What do you need help with/) as HTMLSelectElement).value).toBe('AI Build')
  })

  it.each([
    ['ai-discovery', 'AI Discovery'],
    ['ai-enablement', 'AI Enablement'],
    ['ai-agents', 'Sineva Product Suite'],
    ['not-sure', 'Not sure yet'],
  ])('maps ?service=%s to %s', (slug, interest) => {
    mocks.search.current = new URLSearchParams(`service=${slug}`)
    renderForm({}, ContactFormWithPrefill)
    expect((field(/^What do you need help with/) as HTMLSelectElement).value).toBe(interest)
  })

  it('leaves the field empty for an unknown value or no parameter', () => {
    mocks.search.current = new URLSearchParams('service=hacking')
    const { unmount } = renderForm({}, ContactFormWithPrefill)
    expect((field(/^What do you need help with/) as HTMLSelectElement).value).toBe('')
    unmount()
    mocks.search.current = new URLSearchParams()
    renderForm({}, ContactFormWithPrefill)
    expect((field(/^What do you need help with/) as HTMLSelectElement).value).toBe('')
  })
})

describe('validation on submit', () => {
  it('shows an error summary, with a link to every broken field, and moves focus to it', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    const summary = screen.getByRole('region', { name: 'Please fix these fields' })
    expect(document.activeElement).toBe(summary)
    const links = within(summary).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual([
      'Enter your name.',
      'Enter your work email.',
      'Enter your WhatsApp number.',
      'Choose your business type.',
      'Choose what you need help with.',
      'Write a few words about what you need.',
      'Tick the box to continue.',
    ])
    expect(window.open).not.toHaveBeenCalled()
  })

  it('puts the summary before the first field in the reading order', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    const summary = screen.getByRole('region', { name: 'Please fix these fields' })
    const position = summary.compareDocumentPosition(field(/^Name/))
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('moves focus to the field when its summary link is used', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    await user.click(screen.getByRole('link', { name: 'Enter your name.' }))
    expect(document.activeElement).toBe(field(/^Name/))
    await user.click(screen.getByRole('link', { name: 'Tick the box to continue.' }))
    expect(document.activeElement).toBe(screen.getByRole('checkbox'))
  })

  it('marks each broken field invalid and describes it with its inline error', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    for (const label of [/^Name/, /^Business type/, /^What do you need help with/, /^Message/]) {
      const control = field(label)
      expect(control.getAttribute('aria-invalid')).toBe('true')
      const errorId = control.getAttribute('aria-describedby')!.split(' ').at(-1)!
      expect(document.getElementById(errorId)?.getAttribute('data-slot')).toBe('error')
    }
    const consent = screen.getByRole('checkbox')
    expect(consent.getAttribute('aria-invalid')).toBe('true')
    expect(field(/^Company/).getAttribute('aria-invalid')).toBeNull()
  })

  it('explains a message that is too short and a name that is too short', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(field(/^Name/), 'R')
    await user.type(field(/^Message/), 'too short')
    await user.click(submit())
    const summary = screen.getByRole('region', { name: 'Please fix these fields' })
    expect(within(summary).getByRole('link', { name: 'Enter at least 2 characters.' })).toBeTruthy()
    expect(
      within(summary).getByRole('link', {
        name: 'Write at least 20 characters so we understand your goal.',
      }),
    ).toBeTruthy()
  })

  it('clears a field error as soon as that field becomes valid, and keeps the others', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    await user.type(field(/^Name/), 'Rina')
    expect(field(/^Name/).getAttribute('aria-invalid')).toBeNull()
    const summary = screen.getByRole('region', { name: 'Please fix these fields' })
    expect(within(summary).queryByRole('link', { name: 'Enter your name.' })).toBeNull()
    expect(within(summary).getAllByRole('link')).toHaveLength(6)
  })

  it('removes the summary once every error is fixed', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(submit())
    await fillValid(user)
    expect(screen.queryByRole('region', { name: 'Please fix these fields' })).toBeNull()
  })

  it('keeps every typed value after a failed submit', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(field(/^Name/), 'Rina Wijaya')
    await user.type(field(/^Company/), 'PT Maju')
    await user.click(submit())
    expect((field(/^Name/) as HTMLInputElement).value).toBe('Rina Wijaya')
    expect((field(/^Company/) as HTMLInputElement).value).toBe('PT Maju')
  })

  it('requires the consent: a complete form without it does not open WhatsApp', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(screen.getByRole('checkbox'))
    await user.click(submit())
    expect(window.open).not.toHaveBeenCalled()
    expect(
      within(screen.getByRole('region', { name: 'Please fix these fields' })).getAllByRole('link'),
    ).toHaveLength(1)
  })
})

describe('valid submit', () => {
  it('opens the composed WhatsApp message in a new tab and goes to the thank-you page', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())

    expect(open).toHaveBeenCalledTimes(1)
    const [url, target] = open.mock.calls[0] as [string, string]
    expect(target).toBe('_blank')
    expect(url.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    const text = decodeURIComponent(url.split('?text=')[1]!)
    expect(text).toContain('Hi Sineva')
    expect(text).toContain('Name: Rina Wijaya')
    expect(text).toContain('Company: PT Maju')
    expect(text).toContain('Business type: Startup')
    expect(text).toContain('Interested in: AI Build')
    expect(text).toContain('Budget: IDR 10M to 50M')
    expect(text).toContain('Message: We want an assistant that answers customer chats.')
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/contact/thank-you'))
  })

  it('cuts the link to the opener, so the new tab cannot reach this page', async () => {
    const handle = { opener: window as unknown }
    open.mockImplementation(() => handle as unknown as Window)
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    // `window.open(url, '_blank', 'noopener')` always returns null, which would hide a blocked
    // popup. Opening normally and clearing `opener` keeps both the protection and the detection.
    expect(handle.opener).toBeNull()
  })

  it('opens at most once, even when the form is submitted twice', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()
    await fillValid(user)
    const form = container.querySelector('form')!
    act(() => form.requestSubmit())
    act(() => form.requestSubmit())
    expect(open).toHaveBeenCalledTimes(1)
    // While busy the name gains the hidden "Opening WhatsApp" note, so match by prefix.
    const busy = screen.getByRole('button', { name: /^Send message/ })
    expect(busy.getAttribute('aria-busy')).toBe('true')
    expect((busy as HTMLButtonElement).disabled).toBe(true)
  })

  it('stores the lead with the token and honeypot, then goes to the thank-you page', async () => {
    const user = userEvent.setup()
    const { container } = renderForm()
    await fillValid(user)
    await user.click(submit())
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/contact/thank-you'))
    expect(mocks.save).toHaveBeenCalledTimes(1)
    const [input, meta] = mocks.save.mock.calls[0]
    expect(input).toMatchObject({
      name: 'Rina Wijaya',
      email: 'rina@maju.co.id',
      whatsapp: '0812 3456 7890',
      company: 'PT Maju',
      segment: 'Startup',
      interest: 'AI Build',
      consent: true,
      website: '',
      turnstileToken: 'test-token',
    })
    expect(meta).toEqual({ locale: 'en', sourcePage: '/contact' })
    // Still never a native post: no action or method on the form.
    const form = container.querySelector('form')!
    expect(form.hasAttribute('action')).toBe(false)
    expect(form.hasAttribute('method')).toBe(false)
  })

  it('keeps the answers, explains calmly and asks for a new token when the server refuses', async () => {
    mocks.save.mockResolvedValue({ ok: false, errors: {}, formError: 'x', values: {} })
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain("We couldn't send your message")
    expect(alert.textContent).toContain('Your answers are still here')
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.turnstileReset).toHaveBeenCalled()
    expect((field(/^Work email/) as HTMLInputElement).value).toBe('rina@maju.co.id')
    // The button works again for a retry.
    expect((submit() as HTMLButtonElement).disabled).toBe(false)
  })

  it('waits for the security check before opening anything', async () => {
    window.turnstile = {
      render: () => 'widget',
      reset: () => {},
      remove: () => {},
    } as unknown as NonNullable<Window['turnstile']>
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    expect(open).not.toHaveBeenCalled()
    expect(mocks.save).not.toHaveBeenCalled()
    expect((await screen.findByRole('alert')).textContent).toContain('security check')
  })

  it('checks the work email and the WhatsApp number like the server does', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.clear(field(/^Work email/))
    await user.type(field(/^Work email/), 'rina@')
    await user.clear(field(/^WhatsApp number/))
    await user.type(field(/^WhatsApp number/), '12345')
    await user.click(submit())
    const summary = screen.getByRole('region', { name: 'Please fix these fields' })
    expect(summary.textContent).toContain('Enter an email like name@company.com.')
    expect(summary.textContent).toContain('Enter a number like +62 812 3456 7890.')
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('gives no control a name, so a native submit could never put answers in the URL', () => {
    const { container } = renderForm()
    const named = container.querySelectorAll('input[name], select[name], textarea[name]')
    expect(named).toHaveLength(0)
  })
})

describe('when the new tab is blocked', () => {
  const blocked = () => open.mockImplementation(() => null)

  it('stays on the page, explains, and offers to copy the message and to open it again', async () => {
    blocked()
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())

    expect(mocks.push).not.toHaveBeenCalled()
    const panel = screen.getByRole('region', { name: 'We could not open WhatsApp' })
    expect(document.activeElement).toBe(panel)
    const link = within(panel).getByRole('link', { name: 'Open WhatsApp' })
    expect(link.getAttribute('href')).toContain('https://wa.me/6285199368510?text=')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(within(panel).getByRole('button', { name: 'Copy message' })).toBeTruthy()
    // The typed values stay.
    expect((field(/^Name/) as HTMLInputElement).value).toBe('Rina Wijaya')
  })

  it('copies the composed message to the clipboard and says so', async () => {
    blocked()
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    await user.click(screen.getByRole('button', { name: 'Copy message' }))
    const copied = await navigator.clipboard.readText()
    expect(copied).toContain('Name: Rina Wijaya')
    expect(copied).toContain('Message: We want an assistant that answers customer chats.')
    expect(screen.getByRole('status').textContent).toBe('Message copied')
  })

  it('goes to the thank-you page once the visitor opens WhatsApp from the fallback link', async () => {
    blocked()
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    await user.click(screen.getByRole('link', { name: 'Open WhatsApp' }))
    expect(mocks.push).toHaveBeenCalledWith('/contact/thank-you')
    // The lead was stored once, while the panel was shown.
    expect(mocks.save).toHaveBeenCalledTimes(1)
  })

  it('lets the visitor fix the answers and try again after a block', async () => {
    blocked()
    const user = userEvent.setup()
    renderForm()
    await fillValid(user)
    await user.click(submit())
    open.mockImplementation(() => ({ opener: window }) as unknown as Window)
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1))
    await user.click(submit())
    expect(open).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/contact/thank-you'))
    // Trying again never stores the same lead twice.
    expect(mocks.save).toHaveBeenCalledTimes(1)
  })

  it('offers only the copy button when the WhatsApp number is unusable', async () => {
    const user = userEvent.setup()
    renderForm({
      settings: {
        contact: siteSettings.contact,
        whatsapp: { ...siteSettings.whatsapp, number: '0812' },
      },
    })
    await fillValid(user)
    await user.click(submit())
    expect(open).not.toHaveBeenCalled()
    const panel = screen.getByRole('region', { name: 'We could not open WhatsApp' })
    expect(within(panel).queryByRole('link')).toBeNull()
    expect(within(panel).getByRole('button', { name: 'Copy message' })).toBeTruthy()
  })
})

describe('email route', () => {
  it('is absent while no public email is confirmed (phase 1 settings)', () => {
    expect(siteSettings.contact.email).toBeNull()
    renderForm()
    expect(screen.queryByRole('button', { name: 'Send by email instead' })).toBeNull()
  })

  it('appears when settings carry an email, validates first, then opens the mail app', async () => {
    const user = userEvent.setup()
    renderForm({
      settings: {
        contact: { ...siteSettings.contact, email: 'hello@sineva.id' },
        whatsapp: siteSettings.whatsapp,
      },
    })
    await user.click(screen.getByRole('button', { name: 'Send by email instead' }))
    expect(open).not.toHaveBeenCalled()
    expect(screen.getByRole('region', { name: 'Please fix these fields' })).toBeTruthy()

    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Send by email instead' }))
    const [url, target] = open.mock.calls[0] as [string, string]
    expect(url.startsWith('mailto:hello@sineva.id?subject=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Name: Rina Wijaya')
    expect(target).toBe('_self')
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/contact/thank-you'))
  })
})
