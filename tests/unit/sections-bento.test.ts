import { describe, expect, it } from 'vitest'
import { bentoLayout } from '@/components/sections/_internal/bento'

// BentoGrid (components.md section 13): 6 columns on desktop, tiles 1x1 (2 cols), 2x1 (3 or 4
// cols) and 2x2 (4 cols, 2 rows). Every row must add up to 6 columns so there are no holes.
const spans = (count: number, featured: number | null = null) =>
  bentoLayout(count, featured).map((t) => t.colSpan)

describe('bentoLayout', () => {
  it('returns nothing for an empty list', () => {
    expect(bentoLayout(0, null)).toEqual([])
  })

  it.each([
    [1, [6]],
    [2, [3, 3]],
    [3, [2, 2, 2]],
    [4, [3, 3, 3, 3]],
    [5, [3, 3, 2, 2, 2]],
    [6, [2, 2, 2, 2, 2, 2]],
  ])('fills rows of 6 columns for %i items without a featured tile', (count, expected) => {
    expect(spans(count)).toEqual(expected)
  })

  it('gives the featured tile 4 columns and 2 rows, with two tiles beside it', () => {
    const layout = bentoLayout(5, 0)
    expect(layout[0]).toEqual({ colSpan: 4, rowSpan: 2 })
    expect(layout.slice(1, 3)).toEqual([
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
    ])
    // The two tiles under the featured block share a full row.
    expect(layout.slice(3).map((t) => t.colSpan)).toEqual([3, 3])
  })

  it('keeps the featured block when it is not the first item', () => {
    const layout = bentoLayout(4, 2)
    expect(layout[2]).toEqual({ colSpan: 4, rowSpan: 2 })
    expect(layout.map((t) => t.colSpan)).toEqual([2, 2, 4, 6])
  })

  it('ignores `featured` when there are fewer than three items', () => {
    expect(spans(2, 0)).toEqual([3, 3])
  })

  it('has no row that overflows 6 columns', () => {
    for (let n = 1; n <= 9; n++) {
      for (const featured of [null, 0, n - 1]) {
        const total = bentoLayout(n, featured).reduce((sum, t) => sum + t.colSpan * t.rowSpan, 0)
        // Area in column-rows must be a whole number of full 6-column rows.
        expect(total % 6).toBe(0)
      }
    }
  })
})
