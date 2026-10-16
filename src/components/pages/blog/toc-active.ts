/**
 * Which table of contents entry is current: the first heading, in document order, that sits
 * inside the reading band. When none does (the reader is in the middle of a long section) the
 * previous one stays, so the highlight never blinks off between two headings.
 */
export function pickActiveHeading(
  visible: ReadonlySet<string>,
  orderedIds: readonly string[],
  previous: string | null,
): string | null {
  return orderedIds.find((id) => visible.has(id)) ?? previous
}
