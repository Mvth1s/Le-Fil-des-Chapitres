import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppModal from '~/components/AppModal.vue'

// La modale est teleportee dans body : on monte attache au document et on
// interroge document.body plutot que le wrapper.
let wrapper: VueWrapper | null = null

function mountModal(open: boolean, slots: Record<string, string> = {}) {
  wrapper = mount(AppModal, {
    attachTo: document.body,
    props: {
      open,
      // Boucle v-model : le parent repercute l'emission sur la prop.
      'onUpdate:open': (value: boolean) => wrapper?.setProps({ open: value }),
    },
    slots: {
      title: 'Titre',
      default: '<button id="first">Premier</button><button id="last">Dernier</button>',
      ...slots,
    },
  })
  return wrapper
}

function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')
}

function keydown(target: HTMLElement, key: string, shiftKey = false) {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('AppModal', () => {
  it("ne rend rien quand open est false", () => {
    mountModal(false)
    expect(dialog()).toBeNull()
  })

  it('rend un dialog accessible teleporte dans body', async () => {
    mountModal(true)
    await nextTick()
    const el = dialog()!
    expect(el).not.toBeNull()
    expect(el.parentElement?.classList.contains('app-modal__backdrop')).toBe(true)
    expect(el.parentElement!.parentElement).toBe(document.body)
    expect(el.getAttribute('aria-modal')).toBe('true')
    const title = el.querySelector('h2')!
    expect(title.textContent.trim()).toBe('Titre')
    expect(el.getAttribute('aria-labelledby')).toBe(title.id)
    expect(title.id).not.toBe('')
  })

  it('rend le slot par defaut', async () => {
    mountModal(true, { default: '<p>Contenu</p>' })
    await nextTick()
    expect(dialog()!.querySelector('.app-modal__body')!.textContent).toBe('Contenu')
  })

  it("n'affiche le conteneur d'actions que si le slot actions est fourni", async () => {
    mountModal(true)
    await nextTick()
    expect(dialog()!.querySelector('.app-modal__actions')).toBeNull()
    wrapper!.unmount()
    document.body.innerHTML = ''

    mountModal(true, { actions: '<button>OK</button>' })
    await nextTick()
    expect(dialog()!.querySelector('.app-modal__actions')!.textContent).toBe('OK')
  })

  it('emet update:open false sur Echap', async () => {
    mountModal(true)
    await nextTick()
    keydown(dialog()!, 'Escape')
    expect(wrapper!.emitted('update:open')).toEqual([[false]])
  })

  it('ferme au clic sur le fond mais pas au clic dans la boite', async () => {
    mountModal(true)
    await nextTick()
    dialog()!.click()
    expect(wrapper!.emitted('update:open')).toBeUndefined()
    document.body.querySelector<HTMLElement>('.app-modal__backdrop')!.click()
    expect(wrapper!.emitted('update:open')).toEqual([[false]])
  })

  it('place le focus sur le premier element focusable a l ouverture', async () => {
    mountModal(true)
    await nextTick()
    await nextTick()
    expect(document.activeElement?.id).toBe('first')
  })

  it('piege le focus avec Tab et Shift+Tab', async () => {
    mountModal(true)
    await nextTick()
    await nextTick()
    const first = document.getElementById('first')!
    const last = document.getElementById('last')!

    last.focus()
    const tab = keydown(last, 'Tab')
    expect(tab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    const shiftTab = keydown(first, 'Tab', true)
    expect(shiftTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('bloque le scroll et rend le focus au declencheur a la fermeture', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    mountModal(false)
    await wrapper!.setProps({ open: true })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement?.id).toBe('first')

    keydown(dialog()!, 'Escape')
    await nextTick()
    await nextTick()
    expect(dialog()).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
  })
})
