export type ShareLinks = Readonly<{ whatsapp: string; linkedin: string }>

/**
 * Share urls for an article. `encodeURIComponent` on every value: the article url carries its own
 * `?` and `&`, and an unencoded one would end the share parameter early and drop the rest of the
 * link. WhatsApp's `wa.me/?text=` takes one text (title and link together), LinkedIn takes the url.
 */
export function buildShareLinks({ title, url }: { title: string; url: string }): ShareLinks {
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  }
}

export type CopyResult = 'copied' | 'failed'

/**
 * Copies text with the async Clipboard API. `navigator.clipboard` does not exist outside a secure
 * context (plain http, some in-app browsers) and `writeText` rejects without permission or focus,
 * so every path ends in `'failed'` and the caller shows the fallback message instead of a button
 * that silently does nothing. The legacy `execCommand('copy')` fallback is not used: it is
 * deprecated, and a clear message works in every browser.
 */
export async function copyText(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> | undefined,
): Promise<CopyResult> {
  if (!clipboard) return 'failed'
  try {
    await clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
