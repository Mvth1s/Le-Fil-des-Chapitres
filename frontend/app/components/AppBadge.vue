<script setup lang="ts">
type Variant = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read' | 'neutral'

withDefaults(
  defineProps<{
    variant?: Variant
  }>(),
  {
    variant: 'neutral',
  }
)
</script>

<template>
  <span class="app-badge" :class="`is-${variant}`">
    <span class="app-badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
/*
 * A 12-13px (taille imposee par la charte pour les badges), les couleurs
 * pastel de la palette n'atteignent pas 4.5:1 en texte plein (mesure ~2.3
 * a 3.8:1 selon la couleur, voir resume de l'etape 5) et ce texte est trop
 * petit pour beneficier du seuil "grand texte" (3:1). La couleur du statut
 * reste donc decorative (pastille + bordure), le texte lui-meme garde
 * --color-text sur un fond quasi blanc : contraste plein, conforme AA.
 */
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-body);
  font-style: italic;
  font-size: 13px;
  padding: 2px var(--spacing-sm);
  border-radius: 999px;
  color: var(--color-text);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.app-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.is-reading {
  border-color: var(--color-blue);
}
.is-reading .app-badge__dot {
  background-color: var(--color-blue);
}

.is-completed {
  border-color: var(--color-primary);
}
.is-completed .app-badge__dot {
  background-color: var(--color-primary);
}

.is-on_hold {
  border-color: var(--color-beige);
}
.is-on_hold .app-badge__dot {
  background-color: var(--color-beige);
}

.is-dropped {
  border-color: var(--color-rose);
}
.is-dropped .app-badge__dot {
  background-color: var(--color-rose);
}

.is-plan_to_read {
  border-color: var(--color-border);
}
.is-plan_to_read .app-badge__dot {
  background-color: var(--color-text-muted);
}
</style>
