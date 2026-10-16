import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatBubbles, PhoneFrame } from '@/components/sections/_internal/phone-frame'

describe('PhoneFrame', () => {
  const view = () =>
    render(
      <PhoneFrame chrome={{ name: 'Sino', status: 'Online', day: 'Today' }}>
        <ChatBubbles
          bubbles={[
            { from: 'user', text: 'Sino, reply to today chats' },
            { from: 'sino', text: 'Done. Drafts are ready.' },
          ]}
        />
      </PhoneFrame>,
    )

  it('uses the front-on render whose screen hole is a plain rounded rectangle', () => {
    const { container } = view()
    const shell = container.querySelector('[data-slot="phone-shell"]') as HTMLElement
    expect(shell.style.backgroundImage).toContain('/phone/sineva-phone-front.avif')
  })

  it('draws the chat screen under the frame so the bezel and island cover its edges', () => {
    const { container } = view()
    const frame = container.querySelector('[data-slot="phone-frame"]') as HTMLElement
    const screen = frame.querySelector('[data-slot="phone-screen"]') as HTMLElement
    const img = frame.querySelector('[data-slot="phone-shell"]') as HTMLElement
    // DOM order decides stacking for the absolutely positioned layers: screen first, frame on top.
    expect(screen.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.className).not.toContain('clip-path')
  })

  it('lays the screen out as a chat room: header, messages, composer', () => {
    const { container } = view()
    const screen = container.querySelector('[data-slot="phone-screen"]') as HTMLElement
    const slots = [...screen.querySelectorAll('[data-slot]')].map((el) =>
      el.getAttribute('data-slot'),
    )
    expect(slots).toEqual(
      expect.arrayContaining(['chat-header', 'chat-messages', 'chat-composer', 'chat-bubble']),
    )
    expect(screen.querySelector('[data-slot="chat-header"]')?.textContent).toContain('Sino')
  })
})
