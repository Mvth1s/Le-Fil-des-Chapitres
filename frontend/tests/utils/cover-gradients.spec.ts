import { describe, expect, it } from 'vitest'
import { COVER_GRADIENTS, coverGradientFor } from '~/utils/cover-gradients'

const IDS = [
  '3f2b8c1e-6a4d-4e2f-9b1a-7c5d8e9f0a12',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '00000000-0000-4000-8000-000000000000',
  'ffffffff-ffff-4fff-bfff-ffffffffffff',
  '9e107d9d-372b-4b68-a6a8-1f5c2f8d4e3a',
  'c0ffee00-1234-4567-89ab-cdef01234567',
  '7d793037-a076-4f9b-8e1c-2a3b4c5d6e7f',
  '5a5b5c5d-6e6f-4a1b-9c2d-3e4f5a6b7c8d',
  'deadbeef-0bad-4cab-8bad-f00dcafe0001',
  '1e2d3c4b-5a69-4788-96a5-b4c3d2e1f000',
]

describe('coverGradientFor', () => {
  it('est stable pour un meme id', () => {
    for (const id of IDS) expect(coverGradientFor(id)).toBe(coverGradientFor(id))
  })

  it('retourne toujours un degrade de COVER_GRADIENTS', () => {
    const allowed = Object.values(COVER_GRADIENTS) as string[]
    for (const id of [...IDS, '', 'x', '\u{1F525}']) {
      expect(allowed).toContain(coverGradientFor(id))
    }
  })

  it('repartit un echantillon d ids sur plusieurs degrades', () => {
    expect(new Set(IDS.map(coverGradientFor)).size).toBeGreaterThanOrEqual(3)
  })
})
