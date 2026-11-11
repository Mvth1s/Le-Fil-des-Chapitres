import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppGenreTag from '~/components/AppGenreTag.vue'

// happy-dom conserve les couleurs hexadecimales telles quelles dans style.
function colors(name: string) {
  const el = mount(AppGenreTag, { props: { name } }).element as HTMLElement
  return { text: el.textContent.trim(), bg: el.style.backgroundColor, fg: el.style.color }
}

describe('AppGenreTag', () => {
  it('affiche un genre connu dans sa teinte', () => {
    const { text, bg, fg } = colors('Romance')
    expect(text).toBe('Romance')
    expect(bg.toLowerCase()).toMatch(/#f1dfe3|rgb\(241, 223, 227\)/)
    expect(fg.toLowerCase()).toMatch(/#7a4855|rgb\(122, 72, 85\)/)
  })

  it('replie un genre inconnu sur la teinte neutre', () => {
    const { text, bg, fg } = colors('Inconnu')
    expect(text).toBe('Inconnu')
    expect(bg.toLowerCase()).toMatch(/#f4efe5|rgb\(244, 239, 229\)/)
    expect(fg.toLowerCase()).toMatch(/#3d3b2f|rgb\(61, 59, 47\)/)
  })
})
