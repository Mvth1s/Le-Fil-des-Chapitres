<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md'

withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
  }
)
</script>

<template>
  <button :type="type" :disabled="disabled" class="app-button" :class="[`is-${variant}`, `is-${size}`]">
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-family: var(--font-body);
  font-weight: 700;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity 0.15s ease;
  border: 2px solid transparent;
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-button:not(:disabled):hover {
  opacity: 0.85;
}

.app-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.is-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 14px;
}

/*
 * 19px + gras = "grand texte" au sens WCAG (>= 14pt/18.66px en gras), seuil
 * de contraste 3:1 au lieu de 4.5:1. Necessaire pour is-primary (voir plus
 * bas) : garder cette taille pour ce variant, ne pas la reduire.
 */
.is-md {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 19px;
}

/*
 * --color-primary n'offre que ~3.8:1 de contraste avec du texte fonce, en
 * dessous des 4.5:1 requis en texte courant mais conforme au seuil "grand
 * texte" (3:1) grace a is-md (19px gras, cf. ci-dessus). Ne pas utiliser
 * is-primary avec is-sm (14px) : le contraste ne serait plus conforme.
 * Decision actee avec Mathis a l'etape 5 : limite acceptee pour le MVP,
 * usage restreint aux boutons de taille normale/grande.
 */
.is-primary {
  background-color: var(--color-primary);
  color: var(--color-text);
}

.is-secondary {
  background-color: var(--color-beige);
  color: var(--color-text);
}

.is-outline {
  background-color: transparent;
  border-color: var(--color-primary);
  color: var(--color-text);
}

.is-ghost {
  background-color: transparent;
  color: var(--color-primary);
}

.is-ghost:not(:disabled):hover {
  text-decoration: underline;
  opacity: 1;
}
</style>
