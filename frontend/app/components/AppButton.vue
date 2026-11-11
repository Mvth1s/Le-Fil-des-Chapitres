<script setup lang="ts">
import { NuxtLink } from '#components'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    // Lien avec l'apparence d'un bouton (jamais un <button> dans un <a>,
    // HTML invalide) : `to` = route interne (NuxtLink), `href` = lien externe
    // ouvert dans un nouvel onglet.
    to?: string
    href?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    to: undefined,
    href: undefined,
  }
)

const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))
const tagAttrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { type: props.type, disabled: props.disabled }
})
</script>

<template>
  <component :is="tag" v-bind="tagAttrs" class="app-button" :class="[`is-${variant}`, `is-${size}`]">
    <slot />
  </component>
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
  /* Rendu en lien (to / href) : pas de soulignement par defaut. */
  text-decoration: none;
}

/* aria-disabled : desactive sans perdre le focus (ex. bouton de confirmation
   d'une modale pendant la requete). Le clic doit etre bloque par l'appelant. */
.app-button:disabled,
.app-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-button:not(:disabled):not([aria-disabled='true']):hover {
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
 * Decision actee avec Mvth1s a l'etape 5 : limite acceptee pour le MVP,
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

/* --color-primary en texte n'offre que 2.8:1 sur --color-bg (3.0:1 sur
   --color-surface), sous les 4.5:1 requis a 14px : le texte reste en
   --color-text (10.6:1) et le vert passe dans le soulignement, decoratif. */
.is-ghost {
  background-color: transparent;
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.is-ghost:not(:disabled):not([aria-disabled='true']):hover {
  text-decoration-color: var(--color-text);
  opacity: 1;
}
</style>
