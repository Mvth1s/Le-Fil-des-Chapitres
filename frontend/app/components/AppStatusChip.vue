<script setup lang="ts">
import type { UserWebtoonStatus } from '~/types/user-webtoon'

defineProps<{
  status: UserWebtoonStatus
}>()
</script>

<template>
  <span class="app-status-chip">
    <span
      class="app-status-chip__dot"
      :style="{ backgroundColor: STATUS_COLORS[status] }"
      aria-hidden="true"
    />
    {{ STATUS_LABELS[status] }}
  </span>
</template>

<style scoped>
/*
 * Chip du UI kit (.status-chip), en 14px au lieu de 12px (V5). La couleur du
 * statut reste dans la pastille (decorative) ; le texte garde --color-text sur
 * un fond blanc a 92% : au moins 9:1, meme pose sur la couverture la plus
 * sombre (goldNight).
 */
.app-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-style: italic;
  font-size: var(--fs-tag);
  line-height: 1.3;
  color: var(--color-text);
  background-color: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: 1px solid var(--color-line);
}

.app-status-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
</style>
