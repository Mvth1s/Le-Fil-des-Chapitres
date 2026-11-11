<script setup lang="ts">
type Variant = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read' | 'neutral'

const props = withDefaults(
  defineProps<{
    variant?: Variant
  }>(),
  {
    variant: 'neutral',
  }
)

const dotColor = computed(() => (props.variant === 'neutral' ? 'currentColor' : STATUS_COLORS[props.variant]))
</script>

<template>
  <span class="app-badge" :class="`is-${variant}`">
    <span class="app-badge__dot" :style="{ backgroundColor: dotColor }" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
/*
 * 14px : minimum du projet (CLAUDE.md section 8, CDC "Accessibilite"), qui
 * l'emporte sur les 12-13px du tableau typographique du CDC. Les couleurs
 * pastel de la palette n'atteignent pas 4.5:1 en texte plein (mesure ~2.3
 * a 3.8:1 selon la couleur, voir resume de l'etape 5) et ce texte est trop
 * petit pour beneficier du seuil "grand texte" (3:1). La couleur du statut
 * reste donc decorative (pastille, comme le UI kit), le texte lui-meme garde
 * --color-text sur un fond quasi blanc : contraste plein, conforme AA.
 */
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-body);
  font-style: italic;
  font-size: 14px;
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
}
</style>
