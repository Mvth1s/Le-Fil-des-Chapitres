<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'

const apiBase = useApiBase()
const {
  data: webtoons,
  pending,
  error,
  refresh,
} = await useFetch<Webtoon[]>(`${apiBase}/webtoons`)
</script>

<template>
  <main class="page">
    <h1>Catalogue</h1>

    <p v-if="pending" class="text-secondary">Chargement du catalogue...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger le catalogue pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <p v-else-if="webtoons?.length === 0" class="text-secondary">
      Aucun webtoon dans le catalogue pour l'instant.
    </p>

    <div v-else class="grid">
      <NuxtLink
        v-for="webtoon in webtoons"
        :key="webtoon.id"
        :to="`/catalogue/${webtoon.id}`"
        class="card-link"
      >
        <AppCard>
          <template #header>
            <h3>{{ webtoon.title }}</h3>
          </template>

          <p class="text-secondary">{{ webtoon.author }}</p>
          <p v-if="webtoon.chaptersTotal" class="text-secondary">
            {{ webtoon.chaptersTotal }} chapitres
          </p>

          <div v-if="webtoon.genres.length > 0" class="genres">
            <AppBadge v-for="genre in webtoon.genres" :key="genre.id">{{ genre.name }}</AppBadge>
          </div>
        </AppCard>
      </NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1100px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

/* Toute la carte est cliquable : le lien s'affiche en bloc et n'emprunte
   pas l'apparence par defaut des liens (le style vient de AppCard). */
.card-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.card-link :deep(.app-card) {
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.card-link:hover :deep(.app-card) {
  border-color: var(--color-primary);
  transform: scale(1.02);
}

.card-link:focus-visible :deep(.app-card) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
