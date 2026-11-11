import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppStatusChip from '~/components/AppStatusChip.vue'

describe('AppStatusChip', () => {
  it.each([
    ['reading', 'En cours', '--color-primary'],
    ['completed', 'Terminé', '--color-blue'],
    ['on_hold', 'En pause', '--color-beige'],
    ['dropped', 'Abandonné', '--color-rose'],
    ['plan_to_read', 'À lire', '--color-text-muted'],
  ] as const)('statut %s : libelle "%s", pastille %s', (status, label, color) => {
    const wrapper = mount(AppStatusChip, { props: { status } })
    expect(wrapper.text()).toBe(label)
    const dot = wrapper.find('.app-status-chip__dot')
    expect(dot.attributes('aria-hidden')).toBe('true')
    expect(dot.attributes('style')).toContain(`var(${color})`)
  })
})
