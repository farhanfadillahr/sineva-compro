// Column and row spans for the desktop bento grid (6 columns, components.md section 13: tiles
// 1x1, 2x1 and 2x2). Kept as a pure function so the "no holes" property is testable, and because
// Tailwind needs complete class names: the component maps these numbers to static class strings.

export type BentoTile = Readonly<{ colSpan: 2 | 3 | 4 | 6; rowSpan: 1 | 2 }>

const tile = (colSpan: BentoTile['colSpan'], rowSpan: BentoTile['rowSpan'] = 1): BentoTile => ({
  colSpan,
  rowSpan,
})

/**
 * Fill whole rows of 6 columns, wide tiles first. Rows of three tiles (span 2) are the default.
 * Two leftover tiles become one row of two (span 3). One leftover tile joins the last full row
 * and the four become two rows of two; a lone single tile takes the whole row. No row is short.
 */
function plainRows(count: number): BentoTile[] {
  if (count === 1) return [tile(6)]
  const remainder = count % 3
  const wide = remainder === 1 ? 4 : remainder === 2 ? 2 : 0
  return [
    ...Array.from({ length: wide }, () => tile(3)),
    ...Array.from({ length: count - wide }, () => tile(2)),
  ]
}

/**
 * Layout for `count` tiles in DOM order. `featuredIndex` marks the one large 2x2 tile (4 columns,
 * 2 rows); the first two other tiles sit beside it and the rest flow in full rows underneath.
 * With fewer than three tiles there is nothing to put beside a big tile, so it is ignored.
 */
export function bentoLayout(count: number, featuredIndex: number | null): BentoTile[] {
  if (count <= 0) return []
  const featured =
    featuredIndex !== null && count >= 3 && featuredIndex >= 0 && featuredIndex < count
  if (!featured) return plainRows(count)

  // Non-featured tiles in order: two beside the feature, then plain rows for the remainder.
  const others = [tile(2), tile(2), ...plainRows(count - 3)]
  let next = 0
  return Array.from({ length: count }, (_, i) =>
    i === featuredIndex ? tile(4, 2) : (others[next++] as BentoTile),
  )
}

/** Static class strings (Tailwind scans source for complete names, it cannot build them). */
export const bentoColClass: Record<BentoTile['colSpan'], string> = {
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
}

export const bentoRowClass: Record<BentoTile['rowSpan'], string> = {
  1: '',
  2: 'lg:row-span-2',
}
