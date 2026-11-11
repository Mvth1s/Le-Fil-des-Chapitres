import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCover from '~/components/AppCover.vue'

const URL = 'https://example.com/cover.jpg'
const ID = '3f2b8c1e-6a4d-4e2f-9b1a-7c5d8e9f0a12'
const GENERATED = 'div.app-cover__generated'

function mountCover(src?: string | null) {
  return mount(AppCover, { props: { src, title: 'Tower of God', webtoonId: ID } })
}

describe('AppCover', () => {
  it.each([undefined, null, ''])('affiche la couverture generee quand src vaut %s', (src) => {
    const wrapper = mountCover(src)
    expect(wrapper.find('img').exists()).toBe(false)
    const div = wrapper.find(GENERATED)
    expect(div.exists()).toBe(true)
    // Decorative : le titre est deja lu a cote.
    expect(div.attributes('aria-hidden')).toBe('true')
    expect(div.attributes('style')).toContain('linear-gradient')
    expect(wrapper.findAll('.app-cover__book')).toHaveLength(4)
    // Decision V4 : plus d'initiales.
    expect(wrapper.text()).toBe('')
  })

  it('affiche une image au format 3:4, chargee paresseusement, avec un alt', () => {
    const wrapper = mountCover(URL)
    const img = wrapper.find('img.app-cover__img')
    expect(img.attributes()).toMatchObject({
      src: URL,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      width: '300',
      height: '400',
    })
    expect(wrapper.find(GENERATED).exists()).toBe(false)
  })

  it("bascule sur la couverture generee si l'image ne se charge pas", async () => {
    const wrapper = mountCover(URL)
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find(GENERATED).exists()).toBe(true)
    expect(wrapper.text()).toBe('')
  })

  it("reaffiche l'image quand src change apres une erreur", async () => {
    const wrapper = mountCover(URL)
    await wrapper.find('img').trigger('error')
    await wrapper.setProps({ src: 'https://example.com/autre.jpg' })
    const img = wrapper.find('img.app-cover__img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/autre.jpg')
  })

  it("utilise le meme degrade pour le meme webtoon", () => {
    const a = mountCover(null).find(GENERATED).attributes('style')
    const b = mountCover('').find(GENERATED).attributes('style')
    expect(a).toBe(b)
  })
})
