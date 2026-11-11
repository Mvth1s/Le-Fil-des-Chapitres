import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import AppNavbar from '~/components/AppNavbar.vue'

// navigateTo est un auto-import Nuxt : on remplace l'import pour observer
// l'appel sans naviguer.
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

beforeEach(() => {
  navigateToMock.mockReset()
})

type Wrapper = VueWrapper

function navLinks(wrapper: Wrapper) {
  return wrapper.findAll('nav[aria-label="Navigation principale"] a')
}

function linkByLabel(wrapper: Wrapper, label: string) {
  const link = navLinks(wrapper).find((a) => a.text() === label)
  if (!link) throw new Error(`Lien "${label}" introuvable`)
  return link
}

describe('AppNavbar', () => {
  it('affiche les 4 liens de navigation principale avec leurs href', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    expect(navLinks(wrapper).map((a) => [a.text(), a.attributes('href')])).toEqual([
      ['Accueil', '/'],
      ['Catalogue', '/catalogue'],
      ['Ma liste', '/liste'],
      ['Statistiques', '/statistiques'],
    ])
  })

  it('sur / : seul Accueil est la page courante', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    expect(navLinks(wrapper).map((a) => a.attributes('aria-current'))).toEqual([
      'page',
      undefined,
      undefined,
      undefined,
    ])
  })

  it('sur /catalogue : aria-current="page" sur Catalogue', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/catalogue' })
    expect(linkByLabel(wrapper, 'Catalogue').attributes('aria-current')).toBe('page')
    expect(linkByLabel(wrapper, 'Accueil').attributes('aria-current')).toBeUndefined()
  })

  it('sur une sous-page /catalogue/123 : aria-current="true" sur Catalogue, rien sur Accueil', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/catalogue/123' })
    expect(linkByLabel(wrapper, 'Catalogue').attributes('aria-current')).toBe('true')
    expect(linkByLabel(wrapper, 'Accueil').attributes('aria-current')).toBeUndefined()
    expect(linkByLabel(wrapper, 'Ma liste').attributes('aria-current')).toBeUndefined()
  })

  it('expose un formulaire de recherche dont le champ est relie a un label', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    const form = wrapper.find('form[role="search"]')
    expect(form.exists()).toBe(true)
    const input = form.find('input')
    const id = input.attributes('id')
    expect(id).toBeTruthy()
    const label = form.find(`label[for="${String(id)}"]`)
    expect(label.exists()).toBe(true)
    expect(label.text()).not.toBe('')
  })

  it('soumettre "solo" navigue vers /catalogue?q=solo', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    await wrapper.find('form[role="search"] input').setValue('  solo ')
    await wrapper.find('form[role="search"]').trigger('submit')
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/catalogue', query: { q: 'solo' } })
  })

  it('soumettre des espaces navigue vers /catalogue sans q', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    await wrapper.find('form[role="search"] input').setValue('   ')
    await wrapper.find('form[role="search"]').trigger('submit')
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/catalogue', query: {} })
  })

  it('le bouton menu bascule aria-expanded et son libelle, et pointe vers le panneau', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    const toggle = wrapper.find('button[aria-controls]')
    const panelId = toggle.attributes('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = wrapper.find(`[id="${String(panelId)}"]`)
    expect(panel.exists()).toBe(true)
    // Le panneau contient la navigation et la recherche.
    expect(panel.find('nav[aria-label="Navigation principale"]').exists()).toBe(true)
    expect(panel.find('form[role="search"]').exists()).toBe(true)

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Ouvrir le menu')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Fermer le menu')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('Echap ferme le menu et rend le focus au bouton', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/', attachTo: document.body })
    const toggle = wrapper.find('button[aria-controls]')
    await toggle.trigger('click')
    const input = wrapper.find('form[role="search"] input')
    ;(input.element as HTMLInputElement).focus()

    await input.trigger('keydown', { key: 'Escape' })
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(toggle.element)
    wrapper.unmount()
  })

  it('un clic sur un lien ferme le menu', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    const toggle = wrapper.find('button[aria-controls]')
    await toggle.trigger('click')
    await linkByLabel(wrapper, 'Ma liste').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('un changement de route ferme le menu', async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    const toggle = wrapper.find('button[aria-controls]')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await useRouter().push('/statistiques')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it("n'affiche aucun avatar", async () => {
    const wrapper = await mountSuspended(AppNavbar, { route: '/' })
    expect(wrapper.html().toLowerCase()).not.toContain('avatar')
    // Seule image : le logo, decoratif.
    expect(wrapper.findAll('img').map((img) => img.attributes('alt'))).toEqual([''])
  })
})
