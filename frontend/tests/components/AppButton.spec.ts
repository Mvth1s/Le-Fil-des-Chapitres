import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
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

  it('rend un <button type="button"> par defaut', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.element).toBeInstanceOf(HTMLButtonElement)
    expect(wrapper.attributes('type')).toBe('button')
  })

  // NuxtLink a besoin du routeur Nuxt : mountSuspended le fournit.
  it('rend un lien interne quand to est fourni', async () => {
    const wrapper = await mountSuspended(AppButton, { props: { to: '/catalogue', variant: 'ghost' } })
    expect(wrapper.element).toBeInstanceOf(HTMLAnchorElement)
    expect(wrapper.attributes('href')).toBe('/catalogue')
    expect(wrapper.attributes('target')).toBeUndefined()
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeUndefined()
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['app-button', 'is-ghost', 'is-md']))
  })

  it('rend un lien externe securise quand href est fourni', () => {
    const wrapper = mount(AppButton, { props: { href: 'https://example.com', size: 'sm' } })
    expect(wrapper.element).toBeInstanceOf(HTMLAnchorElement)
    expect(wrapper.attributes()).toMatchObject({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeUndefined()
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['app-button', 'is-primary', 'is-sm']))
  })

  it('donne la priorite a to sur href', async () => {
    const wrapper = await mountSuspended(AppButton, { props: { to: '/catalogue', href: 'https://example.com' } })
    expect(wrapper.attributes('href')).toBe('/catalogue')
    expect(wrapper.attributes('target')).toBeUndefined()
  })
})
