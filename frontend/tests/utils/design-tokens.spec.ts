import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GENRE_TONE_COLORS, type GenreTone } from '~/utils/genre-colors'

// Les valeurs sont lues dans main.css pour que le test suive le CSS reel
// (et detecte une derive entre les tokens CSS et les constantes TS).
// import.meta.url n'est pas un chemin file:// dans l'environnement nuxt :
// vitest est lance depuis frontend/, racine du projet.
const css = readFileSync(resolve(process.cwd(), 'app/assets/css/main.css'), 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!match) throw new Error(`token --${name} absent de main.css`)
  return match[1]!.trim()
}

// Luminance relative et ratio de contraste, formules WCAG 2.x.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const TEXT_MIN = 4.5
const FIELD_BORDER_MIN = 3
const WHITE = '#ffffff'

describe('contrast helper', () => {
  it('matches the reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })
})

describe('design tokens contrast (WCAG AA)', () => {
  const bg = token('color-bg')

  it('--color-on-accent on --color-accent reaches 5.03:1', () => {
    const ratio = contrast(token('color-on-accent'), token('color-accent'))
    expect(ratio).toBeCloseTo(5.03, 2)
    expect(ratio).toBeGreaterThanOrEqual(TEXT_MIN)
  })

  it('--color-focus on --color-bg reaches 4.5:1', () => {
    expect(contrast(token('color-focus'), bg)).toBeGreaterThanOrEqual(TEXT_MIN)
  })

  it('--color-field-border reaches 3:1 on --color-bg and on white', () => {
    const border = token('color-field-border')
    expect(contrast(border, bg)).toBeGreaterThanOrEqual(FIELD_BORDER_MIN)
    expect(contrast(border, WHITE)).toBeGreaterThanOrEqual(FIELD_BORDER_MIN)
  })

  it('--color-text on --color-bg reaches 4.5:1', () => {
    expect(contrast(token('color-text'), bg)).toBeGreaterThanOrEqual(TEXT_MIN)
  })

  // main.css documente que --color-text-muted (3.26:1) est reserve aux usages
  // non textuels ou aux grands textes : on verifie donc le seuil 3:1.
  it('--color-text-muted on --color-bg reaches 3:1', () => {
    expect(contrast(token('color-text-muted'), bg)).toBeGreaterThanOrEqual(FIELD_BORDER_MIN)
  })
})

describe('GENRE_TONE_COLORS', () => {
  const expectedBg: Record<GenreTone, string> = {
    sage: token('color-primary-tint'),
    blue: token('color-blue-tint'),
    rose: token('color-rose-tint'),
    beige: token('color-beige-tint'),
    neutral: token('color-bg-sunken'),
  }

  it.each(Object.keys(expectedBg) as GenreTone[])('%s background matches its CSS token', (tone) => {
    expect(GENRE_TONE_COLORS[tone].bg.toLowerCase()).toBe(expectedBg[tone].toLowerCase())
  })

  it.each(Object.keys(expectedBg) as GenreTone[])('%s text reaches 4.5:1 on its background', (tone) => {
    const { fg, bg } = GENRE_TONE_COLORS[tone]
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(TEXT_MIN)
  })
})

describe('minimum font size', () => {
  it.each(['fs-tag', 'fs-small'])('--%s is at least 14px', (name) => {
    const value = token(name)
    expect(value).toMatch(/^\d+(\.\d+)?px$/)
    expect(parseFloat(value)).toBeGreaterThanOrEqual(14)
  })
})
