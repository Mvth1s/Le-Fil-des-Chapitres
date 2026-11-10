import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Ref } from 'vue'
import { useToast as rawUseToast, type Toast } from '../../app/composables/useToast'

// useState (auto-import Nuxt) n'est pas resolu par le projet TypeScript par
// defaut qu'ESLint utilise pour tests/ : on retype le retour pour le lint.
const useToast: () => {
  toasts: Ref<Toast[]>
  success: (message: string) => number
  error: (message: string) => number
  dismiss: (id: number) => void
} = rawUseToast

beforeEach(() => {
  vi.useFakeTimers()
  useToast().toasts.value = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  it('success et error ajoutent un toast type et retournent son id', () => {
    const { toasts, success, error } = useToast()
    const okId = success('Enregistre')
    const koId = error('Echec')
    expect(okId).not.toBe(koId)
    expect(toasts.value).toEqual([
      { id: okId, type: 'success', message: 'Enregistre' },
      { id: koId, type: 'error', message: 'Echec' },
    ])
  })

  it('dismiss retire uniquement le toast vise', () => {
    const { toasts, success, dismiss } = useToast()
    const a = success('A')
    const b = success('B')
    dismiss(a)
    expect(toasts.value.map((t) => t.id)).toEqual([b])
  })

  it('retire le toast automatiquement apres 5000 ms', () => {
    const { toasts, error } = useToast()
    error('Echec')
    vi.advanceTimersByTime(4999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('partage l etat entre deux appels de useToast', () => {
    const first = useToast()
    const second = useToast()
    first.success('Partage')
    expect(second.toasts.value).toHaveLength(1)
    expect(second.toasts.value.map((t) => t.message)).toEqual(['Partage'])
  })
})
