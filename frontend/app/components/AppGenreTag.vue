<script setup lang="ts">
const props = defineProps<{
  name: string
}>()

// Couple fond / texte verifie AA en test (utils/genre-colors.ts).
const colors = computed(() => genreColors(props.name))
</script>

<template>
  <span class="app-genre-tag" :style="{ backgroundColor: colors.bg, color: colors.fg }">
    {{ name }}
  </span>
</template>

<style scoped>
/* .tag-tinted du UI kit, en 14px (V5). */
.app-genre-tag {
  display: inline-block;
  padding: 3px 11px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-style: italic;
  font-size: var(--fs-tag);
  line-height: 1.3;
}
</style>
