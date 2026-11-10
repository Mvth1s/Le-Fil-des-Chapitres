<script setup lang="ts">
// Modale accessible : focus piege, Echap et clic sur le fond ferment,
// focus rendu au declencheur, scroll de la page bloque pendant l'ouverture.
const open = defineModel<boolean>('open', { required: true })

const titleId = useId()
const dialogRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function close() {
  open.value = false
}

function focusables(): HTMLElement[] {
  return Array.from(dialogRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (items.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }
  const first = items[0]!
  const last = items[items.length - 1]!
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === dialogRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  open,
  async (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      previousFocus = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      ;(focusables()[0] ?? dialogRef.value)?.focus()
    } else {
      document.body.style.overflow = ''
      previousFocus?.focus()
      previousFocus = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (open.value) {
    document.body.style.overflow = ''
    previousFocus?.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="app-modal__backdrop" @click.self="close">
      <div
        ref="dialogRef"
        class="app-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <h2 :id="titleId" class="app-modal__title">
          <slot name="title" />
        </h2>
        <div class="app-modal__body">
          <slot />
        </div>
        <div v-if="$slots.actions" class="app-modal__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.app-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  /* Voile semi-transparent derive de la couleur de texte de la charte. */
  background-color: color-mix(in srgb, var(--color-text) 50%, transparent);
}

.app-modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2 * var(--spacing-md));
  overflow-y: auto;
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 16px;
}

.app-modal:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.app-modal__title {
  margin: 0 0 var(--spacing-md);
  font-family: var(--font-body);
  font-size: 22px;
}

.app-modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}
</style>
