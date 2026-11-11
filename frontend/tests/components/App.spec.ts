import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import App from '~/app.vue'

describe('app.vue', () => {
  it("expose un lien d'evitement vers #contenu, cible focalisable par script", async () => {
    // Pages et header bouchonnes : seul le squelette de app.vue est teste.
    const wrapper = await mountSuspended(App, {
      route: '/',
      global: { stubs: { NuxtPage: true, AppNavbar: true } },
    })
    const skip = wrapper.find('a.skip-link[href="#contenu"]')
    expect(skip.exists()).toBe(true)
    expect(skip.text()).not.toBe('')
    const target = wrapper.find('#contenu')
    expect(target.exists()).toBe(true)
    expect(target.attributes('tabindex')).toBe('-1')
    // Le lien precede le header dans l'ordre de tabulation.
    expect(wrapper.html().indexOf('skip-link')).toBeLessThan(wrapper.html().indexOf('app-navbar'))
  })
})
