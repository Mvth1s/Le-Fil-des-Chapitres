import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPageHeader from '~/components/AppPageHeader.vue'

describe('AppPageHeader', () => {
  it('rend un seul h1 portant le titre', () => {
    const wrapper = mount(AppPageHeader, { props: { title: 'Catalogue global' } })
    const headings = wrapper.findAll('h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]!.text()).toBe('Catalogue global')
  })

  it('affiche sur-titre et sous-titre quand ils sont fournis', () => {
    const wrapper = mount(AppPageHeader, {
      props: { title: 'Titre', eyebrow: 'La bibliothèque', subtitle: 'Un sous-titre' },
    })
    const texts = wrapper.findAll('p').map((p) => p.text())
    expect(texts).toEqual(['La bibliothèque', 'Un sous-titre'])
  })

  it('omet sur-titre et sous-titre quand la prop est vide', () => {
    const wrapper = mount(AppPageHeader, { props: { title: 'Titre', eyebrow: '', subtitle: '' } })
    expect(wrapper.findAll('p')).toHaveLength(0)
  })

  it('ne rend le conteneur d actions que si le slot est fourni', () => {
    const without = mount(AppPageHeader, { props: { title: 'Titre' } })
    expect(without.find('button').exists()).toBe(false)
    expect(without.find('.app-page-header__text').element.nextElementSibling).toBeNull()

    const withSlot = mount(AppPageHeader, {
      props: { title: 'Titre' },
      slots: { actions: '<button type="button">Ajouter</button>' },
    })
    expect(withSlot.get('button').text()).toBe('Ajouter')
  })

  it('masque le filet decoratif aux technologies d assistance', () => {
    const wrapper = mount(AppPageHeader, { props: { title: 'Titre' } })
    const rule = wrapper.get('h1').element.nextElementSibling
    expect(rule?.getAttribute('aria-hidden')).toBe('true')
  })
})
