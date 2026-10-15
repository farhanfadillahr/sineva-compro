import { describe, expect, it } from 'vitest'
import {
  CopyDashError,
  FORBIDDEN_DASH_MESSAGE,
  assertNoForbiddenDashes,
  findForbiddenDashes,
  suggestDashFix,
  validateCopyField,
} from '../../src/lib/copy/dash-rule'
import { COPY_RULES, validatePublicCopy } from '../../src/lib/copy/public-copy'

// Escapes keep the dash code points visible and stop editors or formatters from rewriting them.
const EM = '—'
const EN = '–'
const FIGURE = '‒'
const BAR = '―'
const MINUS = '−'

describe('findForbiddenDashes', () => {
  it('detects an em dash with index, char and code point', () => {
    expect(findForbiddenDashes(`AI agents ${EM} built for small businesses`)).toEqual([
      { index: 10, char: EM, codePoint: 0x2014, source: 'literal' },
    ])
  })

  it('detects an en dash', () => {
    expect(findForbiddenDashes(`Mon${EN}Fri`)).toEqual([
      { index: 3, char: EN, codePoint: 0x2013, source: 'literal' },
    ])
  })

  it('also blocks the look-alikes figure dash and horizontal bar', () => {
    const found = findForbiddenDashes(`a${FIGURE}b${BAR}c`)
    expect(found.map((v) => v.codePoint)).toEqual([0x2012, 0x2015])
  })

  it('does not flag plain hyphens, ranges with a hyphen or the minus sign', () => {
    expect(findForbiddenDashes('10-50 well-known')).toEqual([])
    expect(findForbiddenDashes(`temperature ${MINUS}5`)).toEqual([])
    expect(findForbiddenDashes('10 to 50')).toEqual([])
  })

  it('flags HTML entity forms with the entity text as char', () => {
    const found = findForbiddenDashes('a &mdash; b &ndash; c &#8212; d &#x2013; e &#X2014; f')
    expect(found.map((v) => [v.index, v.char, v.codePoint, v.source])).toEqual([
      [2, '&mdash;', 0x2014, 'entity'],
      [12, '&ndash;', 0x2013, 'entity'],
      [22, '&#8212;', 0x2014, 'entity'],
      [32, '&#x2013;', 0x2013, 'entity'],
      [43, '&#X2014;', 0x2014, 'entity'],
    ])
  })

  it('does not flag unrelated entities', () => {
    expect(findForbiddenDashes('Tom &amp; Jerry &minus; &#8722; &hyphen;')).toEqual([])
  })

  it('scans ICU message strings raw, braces and plural syntax included', () => {
    const icu = `{count, plural, one {# item} other {# items}} ${EM} done`
    const found = findForbiddenDashes(icu)
    expect(found).toHaveLength(1)
    expect(icu.slice(found[0].index, found[0].index + 1)).toBe(EM)
  })

  it('reports UTF-16 indexes that stay valid next to surrogate pairs', () => {
    const text = `\u{1F600}${EM}\u{1F600}${EN}`
    const found = findForbiddenDashes(text)
    expect(found.map((v) => v.index)).toEqual([2, 5])
    for (const v of found) expect(text.slice(v.index, v.index + v.char.length)).toBe(v.char)
  })

  it('returns hits sorted by index when literals and entities are mixed', () => {
    const found = findForbiddenDashes(`&ndash;${EM}&mdash;${EN}`)
    expect(found.map((v) => v.index)).toEqual([0, 7, 8, 15])
  })

  it('handles empty, clean and nullish input', () => {
    expect(findForbiddenDashes('')).toEqual([])
    expect(findForbiddenDashes('Plain copy.')).toEqual([])
    expect(findForbiddenDashes(undefined)).toEqual([])
    expect(findForbiddenDashes(null)).toEqual([])
  })
})

describe('suggestDashFix', () => {
  const cases: [string, string, string][] = [
    [
      'spaced em dash',
      `AI agents ${EM} built for small businesses`,
      'AI agents, built for small businesses',
    ],
    ['unspaced em dash between words', `word${EM}word`, 'word, word'],
    ['spaced en dash between words', `A ${EN} B`, 'A, B'],
    ['en dash between digits', `10${EN}50`, '10-50'],
    ['spaced en dash between digits', `10 ${EN} 50`, '10-50'],
    ['chained digit ranges', `1${EN}2${EN}3`, '1-2-3'],
    ['figure dash between digits', `5${FIGURE}7`, '5-7'],
    ['em dash between digits is not a range', `10${EM}50`, '10, 50'],
    ['run of dashes', `a ${EM}${EM} b`, 'a, b'],
    ['horizontal bar', `a ${BAR} b`, 'a, b'],
    ['leading dash is dropped', `${EM} Hello`, 'Hello'],
    ['trailing dash is dropped', `Hello ${EM}`, 'Hello'],
    ['dash before closing punctuation', `Wait ${EM}.`, 'Wait.'],
    ['dash after a comma', `Yes, ${EM} no`, 'Yes, no'],
    ['dash at a line break', `one ${EM}\ntwo`, 'one\ntwo'],
    ['entity forms are resolved first', 'a &mdash; b and 10&ndash;50', 'a, b and 10-50'],
    ['ICU placeholders stay intact', `{name} ${EM} hi`, '{name}, hi'],
    ['clean text is unchanged', 'Plain 10-50 copy.', 'Plain 10-50 copy.'],
    ['empty string', '', ''],
  ]

  it.each(cases)('%s', (_name, input, expected) => {
    expect(suggestDashFix(input)).toBe(expected)
  })

  it('always yields text without forbidden dashes and is idempotent', () => {
    for (const [, input] of cases) {
      const fixed = suggestDashFix(input)
      expect(findForbiddenDashes(fixed)).toEqual([])
      expect(suggestDashFix(fixed)).toBe(fixed)
    }
  })
})

describe('validateCopyField', () => {
  it('accepts empty, nullish and clean values', () => {
    expect(validateCopyField(undefined)).toEqual({ ok: true })
    expect(validateCopyField(null)).toEqual({ ok: true })
    expect(validateCopyField('')).toEqual({ ok: true })
    expect(validateCopyField('Plain 10-50 copy.')).toEqual({ ok: true })
  })

  it('rejects a dash with the Indonesian message and a fix', () => {
    expect(validateCopyField(`A ${EM} B`)).toEqual({
      ok: false,
      message: 'Gunakan koma atau titik, bukan em dash atau en dash.',
      fix: 'A, B',
    })
    expect(FORBIDDEN_DASH_MESSAGE).toBe('Gunakan koma atau titik, bukan em dash atau en dash.')
  })

  it('rejects entity forms too', () => {
    const result = validateCopyField('A &mdash; B')
    expect(result).toMatchObject({ ok: false, fix: 'A, B' })
  })
})

describe('assertNoForbiddenDashes', () => {
  it('does nothing for clean text', () => {
    expect(() => assertNoForbiddenDashes('Clean 10-50.', 'hero.title')).not.toThrow()
  })

  it('throws a typed error carrying the JSON path and violations', () => {
    let caught: unknown
    try {
      assertNoForbiddenDashes(`Bad ${EM} copy`, 'hero.items[2].title')
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(CopyDashError)
    const error = caught as CopyDashError
    expect(error.path).toBe('hero.items[2].title')
    expect(error.violations).toHaveLength(1)
    expect(error.violations[0].codePoint).toBe(0x2014)
    expect(error.message).toContain('hero.items[2].title')
    expect(error.message).toContain('U+2014')
  })
})

describe('validatePublicCopy', () => {
  it('returns ok with no violations for clean text', () => {
    expect(validatePublicCopy('Clean 10-50.')).toEqual({ ok: true, violations: [] })
  })

  it('returns every violation tagged with its rule id', () => {
    const result = validatePublicCopy(`a ${EM} b ${EN} c &mdash; d`)
    expect(result.ok).toBe(false)
    expect(result.violations.map((v) => v.rule)).toEqual([
      'forbidden-dash',
      'forbidden-dash',
      'forbidden-dash',
    ])
    expect(result.violations.map((v) => v.codePoint)).toEqual([0x2014, 0x2013, 0x2014])
  })

  it('exposes the rule list so more rules can be added later', () => {
    expect(COPY_RULES.map((rule) => rule.id)).toEqual(['forbidden-dash'])
  })
})
