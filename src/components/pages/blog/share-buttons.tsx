'use client'

import { useEffect, useRef, useState } from 'react'
import { WhatsAppGlyph } from '@/components/sections/_internal/icons'
import { Button } from '@/components/ui'
import { buildShareLinks, copyText } from './blog-share'
import { CheckGlyph, LinkedInGlyph, LinkGlyph } from './share-icons'

export type ShareLabels = Readonly<{
  groupLabel: string
  whatsapp: string
  linkedin: string
  copyLink: string
  linkCopied: string
  copyFailed: string
}>

export type ShareButtonsProps = {
  title: string
  /** Absolute url of the article. It is shared as given, so the page builds it from the site url. */
  url: string
  labels: ShareLabels
}

type CopyState = 'idle' | 'copied' | 'failed'

/** How long "Link copied" stays before the button returns to its resting state. */
const FEEDBACK_MS = 2500

/**
 * WhatsApp and LinkedIn share links plus a copy-link button.
 *
 * Copy feedback is a static icon swap and a text message in a live region, with no animation, so
 * reduced motion needs no special case. The animated check (`check-pop`, Lottie L3 in motion.md)
 * is not built yet; when it ships it replaces `CheckGlyph` and must render its final frame under
 * reduced motion, which the Lottie player already does.
 *
 * Copying can fail (insecure context, no permission): the message then tells the reader to copy
 * the link by hand, because a button that silently does nothing is worse than no button.
 */
export function ShareButtons({ title, url, labels }: ShareButtonsProps) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const links = buildShareLinks({ title, url })

  useEffect(() => () => clearTimeout(timer.current), [])

  async function onCopy() {
    const result = await copyText(url, navigator.clipboard)
    clearTimeout(timer.current)
    setState(result)
    timer.current = setTimeout(() => setState('idle'), FEEDBACK_MS)
  }

  const message =
    state === 'copied' ? labels.linkCopied : state === 'failed' ? labels.copyFailed : ''

  return (
    <div role="group" aria-label={labels.groupLabel} className="relative flex flex-wrap gap-3">
      <Button
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        leadingIcon={<WhatsAppGlyph />}
      >
        {labels.whatsapp}
      </Button>
      <Button
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        leadingIcon={<LinkedInGlyph />}
      >
        {labels.linkedin}
      </Button>
      <Button
        variant="secondary"
        data-state={state === 'copied' ? 'copied' : 'idle'}
        leadingIcon={state === 'copied' ? <CheckGlyph /> : <LinkGlyph />}
        onClick={onCopy}
      >
        {labels.copyLink}
      </Button>
      {/* Always mounted: a live region has to exist before its text changes to be announced. */}
      <span
        role="status"
        className="absolute start-0 top-full mt-2 w-max max-w-full rounded-sm bg-surface-inverse px-3 py-1.5 text-micro text-text-inverse shadow-md empty:hidden"
      >
        {message}
      </span>
    </div>
  )
}
