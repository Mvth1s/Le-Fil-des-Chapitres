import { describe, expect, it } from 'vitest'
import { STATUS_COLORS } from '~/utils/status-colors'
import { GENRE_TONE_COLORS, genreColors } from '~/utils/genre-colors'
import { COVER_GRADIENTS } from '~/utils/cover-gradients'
import { USER_WEBTOON_STATUSES } from '~/types/user-webtoon'

describe('STATUS_COLORS', () => {
  it('covers exactly the five reading statuses', () => {
    expect(Object.keys(STATUS_COLORS).sort()).toEqual([...USER_WEBTOON_STATUSES].sort())
  })

  it('maps each status to its palette color', () => {
    expect(STATUS_COLORS).toEqual({
      reading: 'var(--color-primary)',
      completed: 'var(--color-blue)',
      on_hold: 'var(--color-beige)',
      dropped: 'var(--color-rose)',
      plan_to_read: 'var(--color-text-muted)',
    })
  })
})

describe('genreColors', () => {
  const GENRES = [
    'Action', 'Romance', 'Fantasy', 'Horreur', 'Comédie', 'Drame', 'Thriller',
    'Science-Fiction', 'Tranche de vie', 'Isekai', 'Sports', 'Mystère',
    'Historique', 'Surnaturel',
  ]

  it.each(GENRES)('gives %s a non-neutral tone', (name) => {
    const colors = genreColors(name)
    expect(Object.values(GENRE_TONE_COLORS)).toContain(colors)
    expect(colors).not.toBe(GENRE_TONE_COLORS.neutral)
  })

  it('falls back to the neutral tone for an unknown genre', () => {
    expect(genreColors('Genre inconnu')).toBe(GENRE_TONE_COLORS.neutral)
  })
})

describe('COVER_GRADIENTS', () => {
  it('has 9 gradients', () => {
    expect(Object.keys(COVER_GRADIENTS)).toHaveLength(9)
  })
})
