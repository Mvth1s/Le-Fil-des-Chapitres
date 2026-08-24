import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '~/components/AppButton.vue'

describe('AppButton', () => {
  it('rend le contenu du slot', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Valider' } })
    expect(wrapper.text()).toBe('Valider')
  })

  it('applique les classes de variante et de taille par defaut', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.classes()).toContain('is-primary')
    expect(wrapper.classes()).toContain('is-md')
  })

  it('applique les classes de variante et de taille passees en props', () => {
    const wrapper = mount(AppButton, { props: { variant: 'outline', size: 'sm' } })
    expect(wrapper.classes()).toContain('is-outline')
    expect(wrapper.classes()).toContain('is-sm')
  })

  it("n'emet pas de click quand disabled", async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
