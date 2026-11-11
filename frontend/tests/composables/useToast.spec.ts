import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast, TOAST_DURATION_MS } from '~/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  useToast().toasts.value = []
})

afterEach(() => {
  // paused et les minuteurs vivent au niveau du module, hors useState.
  const { toasts, dismiss, resume } = useToast()
  resume()
  for (const toast of toasts.value) dismiss(toast.id)
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

  it('dismiss annule le minuteur du toast', () => {
    const { success, dismiss } = useToast()
    const id = success('A')
    expect(vi.getTimerCount()).toBe(1)
    dismiss(id)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('retire un succes automatiquement apres TOAST_DURATION_MS', () => {
    expect(TOAST_DURATION_MS).toBe(5000)
    const { toasts, success } = useToast()
    success('Enregistre')
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('ne retire jamais une erreur automatiquement', () => {
    const { toasts, error } = useToast()
    error('Echec')
    vi.advanceTimersByTime(10_000)
    expect(toasts.value).toHaveLength(1)
  })

  it('pause suspend le minuteur et resume reprend avec le temps restant', () => {
    const { toasts, success, pause, resume } = useToast()
    success('Enregistre')
    vi.advanceTimersByTime(2000)
    pause()
    vi.advanceTimersByTime(10_000)
    expect(toasts.value).toHaveLength(1)
    resume()
    vi.advanceTimersByTime(2999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('un succes cree pendant une pause ne demarre qu au resume', () => {
    const { toasts, success, pause, resume } = useToast()
    pause()
    success('Enregistre')
    vi.advanceTimersByTime(10_000)
    expect(toasts.value).toHaveLength(1)
    resume()
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('partage l etat entre deux appels de useToast', () => {
    const first = useToast()
    const second = useToast()
    first.success('Partage')
    expect(second.toasts.value.map((t) => t.message)).toEqual(['Partage'])
  })
})
