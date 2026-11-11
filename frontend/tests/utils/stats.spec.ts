import { describe, expect, it } from 'vitest'
import { USER_WEBTOON_STATUSES } from '~/types/user-webtoon'
import {
  formatPercent,
  formatRating,
  genreBars,
  roundedPercentages,
  statusBars,
} from '~/utils/stats'

// Intl insere des espaces insecables (U+00A0, U+202F) : on les ramene a une espace simple.
const normalizeSpaces = (text: string) => text.replace(/\s/gu, ' ')

describe('roundedPercentages', () => {
  it('trois parts egales : le point restant va a la premiere', () => {
    expect(roundedPercentages([1, 1, 1])).toEqual([34, 33, 33])
  })

  it('arrondit au plus fort reste', () => {
    expect(roundedPercentages([2, 1, 0])).toEqual([67, 33, 0])
  })

  it('total nul : tout a 0', () => {
    expect(roundedPercentages([0, 0])).toEqual([0, 0])
  })

  it.each([[[1, 1, 1]], [[1, 2, 3, 4, 5]], [[7, 0, 3]], [[1, 1, 1, 1, 1, 1, 1]], [[13, 29, 1, 0, 6]]])(
    'somme 100 pour %j',
    (counts) => {
      expect(roundedPercentages(counts).reduce((sum, value) => sum + value, 0)).toBe(100)
    }
  )
})

describe('statusBars', () => {
  it('une barre par statut, dans l ordre de USER_WEBTOON_STATUSES', () => {
    const bars = statusBars({ plan_to_read: 1, dropped: 0, on_hold: 1, completed: 0, reading: 2 })
    expect(bars.map((bar) => bar.status)).toEqual([...USER_WEBTOON_STATUSES])
    expect(bars.map((bar) => bar.count)).toEqual([2, 0, 1, 0, 1])
    expect(bars.map((bar) => bar.percent)).toEqual([50, 0, 25, 0, 25])
  })
})

describe('genreBars', () => {
  it('largeur relative au genre le plus lu', () => {
    const bars = genreBars([
      { name: 'Action', slug: 'action', count: 4 },
      { name: 'Romance', slug: 'romance', count: 1 },
    ])
    expect(bars.map((bar) => bar.width)).toEqual([100, 25])
    expect(bars.map((bar) => bar.slug)).toEqual(['action', 'romance'])
  })

  it('entree vide : []', () => {
    expect(genreBars([])).toEqual([])
  })
})

describe('formats', () => {
  it('formatPercent(25) => "25 %"', () => {
    expect(normalizeSpaces(formatPercent(25))).toBe('25 %')
  })

  it('formatRating : virgule decimale, pas de ",0"', () => {
    expect(formatRating(8.5)).toBe('8,5')
    expect(formatRating(9)).toBe('9')
  })
})
