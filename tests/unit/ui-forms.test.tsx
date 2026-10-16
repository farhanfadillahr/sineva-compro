import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '../../src/components/ui/checkbox'
import { Field } from '../../src/components/ui/field'
import { Input } from '../../src/components/ui/input'
import { Select } from '../../src/components/ui/select'
import { Textarea } from '../../src/components/ui/textarea'

const has = (el: Element, ...classes: string[]) => classes.every((c) => el.classList.contains(c))
const FOCUS = [
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'focus-visible:outline-focus',
]

describe('Input', () => {
  it('is a 48px, small radius, input-border control with a visible focus ring', () => {
    render(<Input aria-label="Name" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input.getAttribute('type')).toBe('text')
    expect(
      has(
        input,
        'h-12',
        'rounded-sm',
        'border',
        'border-border-input',
        'bg-surface',
        'text-text',
        'text-base',
        'hover:border-text-secondary',
        'focus-visible:border-action-primary',
        ...FOCUS,
      ),
    ).toBe(true)
  })

  it('switches to the danger border when aria-invalid is set', () => {
    render(<Input aria-label="Name" aria-invalid="true" />)
    const input = screen.getByRole('textbox')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.classList.contains('aria-[invalid=true]:border-danger')).toBe(true)
  })

  it('passes type, inputMode and the ref through (phone fields)', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={ref} type="tel" inputMode="tel" aria-label="Phone" />)
    expect(ref.current).toBe(screen.getByLabelText('Phone'))
    expect(ref.current?.getAttribute('inputmode')).toBe('tel')
  })

  it('accepts typing and respects disabled', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Input aria-label="Name" />
        <Input aria-label="Locked" disabled />
      </>,
    )
    await user.type(screen.getByLabelText('Name'), 'Sino')
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Sino')
    const locked = screen.getByLabelText('Locked') as HTMLInputElement
    expect(locked.disabled).toBe(true)
    expect(has(locked, 'disabled:opacity-45', 'disabled:cursor-not-allowed')).toBe(true)
  })

  it('appends a caller className', () => {
    render(<Input aria-label="Name" className="max-w-sm" />)
    expect(screen.getByLabelText('Name').className.endsWith('max-w-sm')).toBe(true)
  })
})

describe('Textarea', () => {
  it('is at least 128px tall with the same field styling and focus ring', () => {
    render(<Textarea aria-label="Message" />)
    const textarea = screen.getByRole('textbox', { name: 'Message' })
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(
      has(
        textarea,
        'min-h-32',
        'rounded-sm',
        'border-border-input',
        'aria-[invalid=true]:border-danger',
        ...FOCUS,
      ),
    ).toBe(true)
  })
})

describe('Select', () => {
  it('is a native select with options, a decorative chevron and a focus ring', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Select aria-label="Topic" defaultValue="" onChange={onChange}>
        <option value="">Choose</option>
        <option value="ai">AI Build</option>
      </Select>,
    )
    const select = screen.getByRole('combobox', { name: 'Topic' }) as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
    expect(
      has(select, 'h-12', 'rounded-sm', 'appearance-none', 'border-border-input', ...FOCUS),
    ).toBe(true)
    expect(
      select.parentElement?.querySelector('[data-slot="chevron"]')?.getAttribute('aria-hidden'),
    ).toBe('true')
    await user.selectOptions(select, 'ai')
    expect(select.value).toBe('ai')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('reserves room for the chevron so long values never run under it', () => {
    render(<Select aria-label="Topic" />)
    expect(screen.getByRole('combobox').classList.contains('pr-11')).toBe(true)
  })

  it('applies invalid styling hooks and keeps wrapperClassName off the select', () => {
    render(
      <Select
        aria-label="Topic"
        aria-invalid="true"
        className="w-full"
        wrapperClassName="max-w-xs"
      />,
    )
    const select = screen.getByRole('combobox')
    expect(select.classList.contains('aria-[invalid=true]:border-danger')).toBe(true)
    expect(select.classList.contains('max-w-xs')).toBe(false)
    expect(select.parentElement?.classList.contains('max-w-xs')).toBe(true)
  })
})

describe('Checkbox', () => {
  it('is a 20px box with a 6px radius, a checked fill and a clickable label', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox label="I agree to the privacy policy" onChange={onChange} />)
    const box = screen.getByRole('checkbox', {
      name: 'I agree to the privacy policy',
    }) as HTMLInputElement
    expect(
      has(
        box,
        'size-5',
        'rounded-xs',
        'appearance-none',
        'border-border-input',
        'checked:bg-action-primary',
        'checked:border-action-primary',
        ...FOCUS,
      ),
    ).toBe(true)
    // Clicking the label text, not the box, must toggle it.
    await user.click(screen.getByText('I agree to the privacy policy'))
    expect(box.checked).toBe(true)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('draws the white check mark as a decorative sibling that only shows when checked', () => {
    render(<Checkbox label="Agree" />)
    const box = screen.getByRole('checkbox')
    const mark = box.parentElement?.querySelector('[data-slot="check"]')
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
    expect(has(mark!, 'text-text-inverse', 'hidden', 'peer-checked:block')).toBe(true)
    expect(box.classList.contains('peer')).toBe(true)
  })

  it('toggles with Space and keeps a 44px tall label row', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Agree" />)
    await user.tab()
    const box = screen.getByRole('checkbox') as HTMLInputElement
    expect(document.activeElement).toBe(box)
    await user.keyboard(' ')
    expect(box.checked).toBe(true)
    expect(box.closest('label')?.classList.contains('min-h-11')).toBe(true)
  })

  it('wires helper and error text for assistive tech', () => {
    render(
      <Checkbox
        label="Agree"
        helper="You can withdraw any time"
        error="Please accept to continue"
      />,
    )
    const box = screen.getByRole('checkbox')
    expect(box.getAttribute('aria-invalid')).toBe('true')
    const described = (box.getAttribute('aria-describedby') ?? '').split(' ')
    expect(described).toHaveLength(2)
    const texts = described.map((id) => document.getElementById(id)?.textContent)
    expect(texts).toEqual(['You can withdraw any time', 'Please accept to continue'])
  })

  it('has no aria-invalid or aria-describedby without helper or error', () => {
    render(<Checkbox label="Agree" />)
    const box = screen.getByRole('checkbox')
    expect(box.hasAttribute('aria-invalid')).toBe(false)
    expect(box.hasAttribute('aria-describedby')).toBe(false)
  })

  it('respects disabled', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Agree" disabled onChange={onChange} />)
    await userEvent.click(screen.getByText('Agree'))
    expect(onChange).not.toHaveBeenCalled()
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true)
  })
})

describe('Field wiring', () => {
  it('associates the label with the control through for/id', () => {
    render(<Field label="Email">{(control) => <Input type="email" {...control} />}</Field>)
    const input = screen.getByLabelText('Email')
    expect(input.tagName).toBe('INPUT')
    const label = document.querySelector('label')!
    expect(label.getAttribute('for')).toBe(input.id)
    expect(input.id).not.toBe('')
  })

  it('uses the supplied id', () => {
    render(
      <Field label="Email" id="email">
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(screen.getByLabelText('Email').id).toBe('email')
  })

  it('renders label text at the label token size and weight', () => {
    render(<Field label="Email">{(control) => <Input {...control} />}</Field>)
    expect(has(document.querySelector('label')!, 'text-label', 'text-text')).toBe(true)
  })

  it('adds no aria-describedby, aria-invalid or aria-required by default', () => {
    render(<Field label="Email">{(control) => <Input {...control} />}</Field>)
    const input = screen.getByLabelText('Email')
    expect(input.hasAttribute('aria-describedby')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
    expect(input.hasAttribute('aria-required')).toBe(false)
  })

  it('links helper text with aria-describedby', () => {
    render(
      <Field label="Email" helper="We reply within a day">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText('Email')
    const helper = document.getElementById(input.getAttribute('aria-describedby')!)
    expect(helper?.textContent).toBe('We reply within a day')
    expect(helper?.getAttribute('data-slot')).toBe('helper')
    expect(has(helper!, 'text-micro', 'text-text-tertiary')).toBe(true)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })

  it('shows a visible error, marks the control invalid and describes it by the error', () => {
    render(
      <Field label="Email" error="Enter a valid email address">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText('Email')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const error = document.getElementById(input.getAttribute('aria-describedby')!)
    expect(error?.textContent).toBe('Enter a valid email address')
    expect(error?.getAttribute('data-slot')).toBe('error')
    expect(has(error!, 'text-danger', 'text-micro')).toBe(true)
    expect(error?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('describes the control by helper and error together, helper first', () => {
    render(
      <Field label="Email" helper="Work address" error="Required">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const ids = screen.getByLabelText('Email').getAttribute('aria-describedby')!.split(' ')
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
      'Work address',
      'Required',
    ])
  })

  it('sets aria-required and shows the required marker text supplied by the caller', () => {
    render(
      <Field label="Email" required requiredLabel="(required)">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText(/Email/)
    expect(input.getAttribute('aria-required')).toBe('true')
    const marker = screen.getByText('(required)')
    expect(marker.classList.contains('sr-only')).toBe(false)
  })

  it('can hide the required marker visually while screen readers keep it', () => {
    render(
      <Field label="Email" required requiredLabel="(required)" requiredVisible={false}>
        {(control) => <Input {...control} />}
      </Field>,
    )
    expect(screen.getByText('(required)').classList.contains('sr-only')).toBe(true)
    expect(screen.getByLabelText(/Email/).getAttribute('aria-required')).toBe('true')
  })

  it('works with Textarea and Select too', () => {
    render(
      <>
        <Field label="Message" error="Too short">
          {(control) => <Textarea {...control} />}
        </Field>
        <Field label="Topic" helper="Pick one">
          {(control) => (
            <Select {...control}>
              <option>AI Build</option>
            </Select>
          )}
        </Field>
      </>,
    )
    expect(screen.getByLabelText('Message').getAttribute('aria-invalid')).toBe('true')
    const topic = screen.getByLabelText('Topic')
    expect(document.getElementById(topic.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Pick one',
    )
  })

  it('generates distinct ids for sibling fields', () => {
    render(
      <>
        <Field label="First">{(control) => <Input {...control} />}</Field>
        <Field label="Second">{(control) => <Input {...control} />}</Field>
      </>,
    )
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id)
  })

  it('focuses the control when its label is clicked', async () => {
    render(<Field label="Email">{(control) => <Input {...control} />}</Field>)
    await userEvent.click(screen.getByText('Email'))
    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })
})
