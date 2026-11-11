import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '~/components/AppInput.vue'

describe('AppInput : aide et erreur', () => {
  it('rend le hint et le lie au champ', () => {
    const wrapper = mount(AppInput, { props: { label: 'URL', hint: 'Adresse https' } })
    const hint = wrapper.get('.app-input__hint')
    expect(hint.text()).toBe('Adresse https')
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(hint.attributes('id'))
  })

  it('aria-describedby contient l id de l aide et celui de l erreur', () => {
    const wrapper = mount(AppInput, {
      props: { label: 'URL', hint: 'Adresse https', error: 'URL invalide' },
    })
    const ids = wrapper.get('input').attributes('aria-describedby')?.split(' ')
    expect(ids).toEqual([
      wrapper.get('.app-input__hint').attributes('id'),
      wrapper.get('.app-input__error').attributes('id'),
    ])
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('sans aide ni erreur : pas d aria-describedby', () => {
    const wrapper = mount(AppInput, { props: { label: 'URL' } })
    expect(wrapper.find('.app-input__hint').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
  })
})
