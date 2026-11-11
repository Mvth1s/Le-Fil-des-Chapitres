<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    subtitle?: string
  }>(),
  {
    eyebrow: '',
    subtitle: '',
  }
)
</script>

<template>
  <!-- En-tete de page du UI kit (.page-head) : sur-titre, H1, filet dore,
       sous-titre ; slot "actions" a droite (ex. "Ajouter un webtoon"). -->
  <div class="app-page-header">
    <div class="app-page-header__text">
      <p v-if="eyebrow" class="app-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="app-page-header__title">{{ title }}</h1>
      <span class="app-page-header__rule" aria-hidden="true" />
      <p v-if="subtitle" class="app-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="app-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.app-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4) var(--space-5);
  margin-bottom: var(--space-6);
}

.app-page-header__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* Lettres espacees en CSS, pas dans le texte : le lecteur d'ecran lit un mot.
   --color-text-soft : le gris du UI kit echoue en AA a 14px. */
.app-page-header__eyebrow {
  margin: 0;
  font-size: var(--fs-small);
  font-style: italic;
  letter-spacing: var(--letter-tag);
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.app-page-header__title {
  margin: 0;
  font-size: var(--fs-h1);
  line-height: var(--lh-tight);
}

/* Filet dore decoratif (.page-rule du UI kit). */
.app-page-header__rule {
  display: block;
  width: 200px;
  max-width: 100%;
  height: 1px;
  margin-top: 6px;
  background-color: var(--color-accent);
  opacity: 0.55;
}

.app-page-header__subtitle {
  max-width: 620px;
  margin: var(--space-2) 0 0;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text-soft);
}

.app-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

@media (max-width: 639px) {
  .app-page-header__title {
    font-size: 36px;
  }
}
</style>
