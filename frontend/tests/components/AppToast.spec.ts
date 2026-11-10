import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppToast from '~/components/AppToast.vue'
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
  useToast().toasts.value = []
})

describe('AppToast', () => {
  it('rend les deux regions live des le rendu initial', () => {
    const wrapper = mount(AppToast)
    expect(wrapper.find('[aria-live="assertive"][role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[aria-live="polite"][role="status"]').exists()).toBe(true)
  })

  it('place les erreurs en region assertive et les succes en region polite', async () => {
    const wrapper = mount(AppToast)
    const { success, error } = useToast()
    success('Enregistre')
    error('Echec')
    await nextTick()

    const alert = wrapper.find('[aria-live="assertive"][role="alert"]')
    const status = wrapper.find('[aria-live="polite"][role="status"]')
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
})
