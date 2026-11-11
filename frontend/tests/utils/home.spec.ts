import { describe, expect, it } from 'vitest'
import { countLabel, formatCount, greetingFor, readingCountLine } from '~/utils/home'

// Intl fr-FR separe les milliers par une espace fine insecable (U+202F).
const NNBSP = ' '

describe('formatCount', () => {
  it('separe les milliers par U+202F', () => {
    expect(formatCount(12345)).toBe(`12${NNBSP}345`)
  })

  it('laisse les petits nombres intacts', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(999)).toBe('999')
  })
})

describe('countLabel', () => {
  it('0 et 1 sont au singulier', () => {
    expect(countLabel(0, 'chapitre', 'chapitres')).toBe('0 chapitre')
    expect(countLabel(1, 'chapitre', 'chapitres')).toBe('1 chapitre')
  })

  it('pluriel au-dela de 1', () => {
    expect(countLabel(2, 'chapitre', 'chapitres')).toBe('2 chapitres')
  })

  it('formate le nombre', () => {
    expect(countLabel(2076, 'chapitre', 'chapitres')).toBe(`2${NNBSP}076 chapitres`)
  })
})

describe('greetingFor', () => {
  it.each([
    [0, 'Bonsoir,'],
    [4, 'Bonsoir,'],
    [5, 'Bonjour,'],
    [12, 'Bonjour,'],
    [17, 'Bonjour,'],
    [18, 'Bonsoir,'],
    [23, 'Bonsoir,'],
  ])('%i h => %s', (hour, expected) => {
    expect(greetingFor(hour)).toBe(expected)
  })
})

describe('readingCountLine', () => {
  it('0 : aucun webtoon en cours', () => {
    expect(readingCountLine(0)).toBe("tu n'as aucun webtoon en cours.")
  })

  it('1 : singulier', () => {
    expect(readingCountLine(1)).toBe('tu as 1 webtoon en cours.')
  })

  it('4 : pluriel', () => {
    expect(readingCountLine(4)).toBe('tu as 4 webtoons en cours.')
  })
})
