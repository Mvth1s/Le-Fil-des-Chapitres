import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useToast } from '~/composables/useToast'
import AppToast from '~/components/AppToast.vue'

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

const ALERT = '[aria-live="assertive"][role="alert"]'
const STATUS = '[aria-live="polite"][role="status"]'

describe('AppToast', () => {
  it('rend les deux regions live des le rendu initial', () => {
    const wrapper = mount(AppToast)
    for (const selector of [ALERT, STATUS]) {
      const region = wrapper.find(selector)
      expect(region.exists()).toBe(true)
      expect(region.attributes('aria-atomic')).toBe('false')
      expect(region.attributes('aria-relevant')).toBe('additions')
    }
  })

  it('place les erreurs en region assertive et les succes en region polite', async () => {
    const wrapper = mount(AppToast)
    const { success, error } = useToast()
    success('Enregistre')
    error('Echec')
    await nextTick()

    const alert = wrapper.find(ALERT)
    const status = wrapper.find(STATUS)
    expect(alert.find('.is-error').text()).toContain('Echec')
    expect(alert.find('.is-success').exists()).toBe(false)
    expect(status.find('.is-success').text()).toContain('Enregistre')
    expect(status.find('.is-error').exists()).toBe(false)
  })

  it('retire le toast au clic sur le bouton de fermeture', async () => {
    const wrapper = mount(AppToast)
    useToast().error('Echec')
    await nextTick()

    const close = wrapper.find('.app-toast__close')
    expect(close.attributes('aria-label')).toBe('Fermer le message')
    await close.trigger('click')
    expect(wrapper.find('.app-toast').exists()).toBe(false)
    expect(useToast().toasts.value).toHaveLength(0)
  })

  it('suspend la disparition au survol et la reprend en sortie', async () => {
    const wrapper = mount(AppToast)
    useToast().success('Enregistre')
    await nextTick()
    const container = wrapper.find('.app-toast__container')

    await container.trigger('mouseenter')
    vi.advanceTimersByTime(10_000)
    await nextTick()
    expect(wrapper.find('.app-toast').exists()).toBe(true)

    await container.trigger('mouseleave')
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(wrapper.find('.app-toast').exists()).toBe(false)
  })

  it('ne reprend pas sur un focusout vers un element du conteneur', async () => {
    const wrapper = mount(AppToast, { attachTo: document.body })
    const { success } = useToast()
    success('A')
    success('B')
    await nextTick()
    const container = wrapper.find('.app-toast__container')
    const second = wrapper.findAll('.app-toast__close')[1]
    if (!second) throw new Error('second close button missing')

    await container.trigger('focusin')
    await container.trigger('focusout', { relatedTarget: second.element })
    vi.advanceTimersByTime(10_000)
    await nextTick()
    expect(wrapper.findAll('.app-toast')).toHaveLength(2)

    await container.trigger('focusout', { relatedTarget: null })
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(wrapper.findAll('.app-toast')).toHaveLength(0)
    wrapper.unmount()
  })
})
