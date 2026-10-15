// RFC 4647 basic language range and RFC 9110 weight (0..1, up to 3 decimals).
const preference =
  /^(\*|[a-z]{1,8}(?:-[a-z0-9]{1,8})*)(?:[\t ]*;[\t ]*q=(0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?))?$/i

/** Validate syntax only; matching and weighting remain next-intl's responsibility. */
export function normalizeAcceptLanguage(value: string | null): string {
  if (!value) return ''
  const normalized: string[] = []
  for (const entry of value.split(',')) {
    const token = entry.trim()
    // HTTP list recipients ignore empty members.
    if (!token) continue
    const match = preference.exec(token)
    if (!match) return ''
    normalized.push(match[2] === undefined ? match[1] : `${match[1]};q=${match[2]}`)
  }
  return normalized.join(', ')
}
