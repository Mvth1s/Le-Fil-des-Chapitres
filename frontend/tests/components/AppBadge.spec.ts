import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBadge from '~/components/AppBadge.vue'

describe('AppBadge', () => {
  it('rend le contenu du slot', () => {
    const wrapper = mount(AppBadge, { slots: { default: 'Fantasy' } })
    expect(wrapper.text()).toBe('Fantasy')
  })

  it('utilise la variante "neutral" par defaut', () => {
    const wrapper = mount(AppBadge)
    expect(wrapper.classes()).toContain('is-neutral')
  })

  it('applique la classe de variante passee en prop', () => {
    const wrapper = mount(AppBadge, { props: { variant: 'reading' } })
    expect(wrapper.classes()).toContain('is-reading')
  })
})
