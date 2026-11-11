<script setup lang="ts">
// A monter une seule fois (app.vue). Les regions live existent des le rendu
// initial : un lecteur d'ecran n'annonce que les changements d'une region
// deja presente dans le DOM.
const { toasts, dismiss, pause, resume } = useToast()

// focusout vers un autre element de la zone ne doit pas relancer les minuteurs.
function onFocusout(event: FocusEvent) {
  const container = event.currentTarget as HTMLElement
  if (!container.contains(event.relatedTarget as Node | null)) resume()
}

const successToasts = computed(() => toasts.value.filter((toast) => toast.type === 'success'))
const errorToasts = computed(() => toasts.value.filter((toast) => toast.type === 'error'))
</script>

<template>
  <div
    class="app-toast__container"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="onFocusout"
  >
    <div
      aria-live="assertive"
      aria-atomic="false"
      aria-relevant="additions"
      role="alert"
      class="app-toast__region"
    >
      <div v-for="toast in errorToasts" :key="toast.id" class="app-toast is-error">
        <p class="app-toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="app-toast__close"
          aria-label="Fermer le message"
          @click="dismiss(toast.id)"
        >
          &times;
        </button>
      </div>
    </div>
    <div
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      role="status"
      class="app-toast__region"
    >
      <div v-for="toast in successToasts" :key="toast.id" class="app-toast is-success">
        <p class="app-toast__message">{{ toast.message }}</p>
        <button
          type="button"
          class="app-toast__close"
          aria-label="Fermer le message"
          @click="dismiss(toast.id)"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-toast__container {
  position: fixed;
  right: var(--spacing-md);
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
  pointer-events: none;
}

.app-toast__region {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.app-toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  max-width: 400px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-left-width: 6px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 16px;
  pointer-events: auto;
}

/* Le type est porte par la bordure coloree, le texte reste --color-text sur
   fond --color-surface pour garantir le contraste AA. */
.is-success {
  border-left-color: var(--color-primary);
}

.is-error {
  border-left-color: var(--color-rose);
}

.app-toast__message {
  margin: 0;
  flex: 1;
}

.app-toast__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Cible tactile minimale WCAG 2.5.8 (24x24 px). */
  min-width: 24px;
  min-height: 24px;
  padding: 0 var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.app-toast__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
