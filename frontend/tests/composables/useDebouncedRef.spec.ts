import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, watch, type Ref } from 'vue'
import { useDebouncedRef } from '~/composables/useDebouncedRef'

describe('useDebouncedRef', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function setup() {
    const scope = effectScope()
    const source = ref('')
    const debounced = scope.run(() => useDebouncedRef(source)) as Readonly<Ref<string>>
    return { scope, source, debounced }
  }

  it('ne se met pas a jour avant 300 ms', async () => {
    const { scope, source, debounced } = setup()
    source.value = 'abc'
    await nextTick()
    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('abc')
    scope.stop()
  })

  it('ne retient que la derniere valeur apres plusieurs saisies rapides', async () => {
    const { scope, source, debounced } = setup()
    const seen: string[] = []
    scope.run(() => watch(debounced, (v) => seen.push(v)))
    for (const v of ['a', 'ab', 'abc']) {
      source.value = v
      await nextTick()
      vi.advanceTimersByTime(100)
    }
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(debounced.value).toBe('abc')
    expect(seen).toEqual(['abc'])
    scope.stop()
  })

  it('annule le timer a l arret du scope', async () => {
    const { scope, source, debounced } = setup()
    source.value = 'abc'
    await nextTick()
    scope.stop()
    vi.advanceTimersByTime(1000)
    expect(debounced.value).toBe('')
    expect(vi.getTimerCount()).toBe(0)
  })
})
