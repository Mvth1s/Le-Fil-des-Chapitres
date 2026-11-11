import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCover from '~/components/AppCover.vue'

const URL = 'https://example.com/cover.jpg'

const FALLBACK = 'div.app-cover__fallback'

describe('AppCover', () => {
  it.each([null, '', undefined])('affiche le repli quand src vaut %s', (src) => {
    const wrapper = mount(AppCover, { props: { src, title: 'Tower of God' } })
    expect(wrapper.find('img').exists()).toBe(false)
    const div = wrapper.find(FALLBACK)
    expect(div.exists()).toBe(true)
    // Decoratif : le titre est deja lu a cote, la couverture est masquee.
    expect(div.attributes('aria-hidden')).toBe('true')
    expect(div.attributes('role')).toBeUndefined()
    expect(div.attributes('aria-label')).toBeUndefined()
    expect(div.text()).toBe('TO')
  })

  it.each([
    ['Tower of God', 'TO'],
    ['Solo Leveling Ragnarok', 'SL'],
    ['Omniscient', 'O'],
    ['éclat de lune', 'ÉD'],
    ['  lore   olympus ', 'LO'],
    ['\u{1F525}fire force', '\u{1F525}F'],
  ])('calcule les initiales de "%s" => "%s"', (title, expected) => {
    const wrapper = mount(AppCover, { props: { src: null, title } })
    expect(wrapper.find(FALLBACK).text()).toBe(expected)
  })

  it('affiche une image decorative et legere quand src est valide', () => {
    const wrapper = mount(AppCover, { props: { src: URL, title: 'Tower of God' } })
    const img = wrapper.find('img.app-cover__img')
    expect(img.exists()).toBe(true)
    expect(img.attributes()).toMatchObject({
      src: URL,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      width: '200',
      height: '300',
    })
    expect(wrapper.find(FALLBACK).exists()).toBe(false)
  })

  it("bascule sur le repli si l'image ne se charge pas", async () => {
    const wrapper = mount(AppCover, { props: { src: URL, title: 'Tower of God' } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find(FALLBACK).exists()).toBe(true)
  })

  it("reaffiche l'image quand src change apres une erreur", async () => {
    const wrapper = mount(AppCover, { props: { src: URL, title: 'Tower of God' } })
    await wrapper.find('img').trigger('error')
    await wrapper.setProps({ src: 'https://example.com/autre.jpg' })
    const img = wrapper.find('img.app-cover__img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/autre.jpg')
  })
})
