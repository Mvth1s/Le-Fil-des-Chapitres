<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'

const route = useRoute()
const apiBase = useApiBase()
// route.params.id est une route dynamique unique ([id].vue, pas [...id].vue) :
// toujours une string, jamais un tableau, mais le typage de vue-router
// reste generique.
const webtoonId = String(route.params.id)
const {
  data: webtoon,
  pending,
  error,
  refresh,
} = await useFetch<Webtoon>(`${apiBase}/webtoons/${webtoonId}`)
</script>

<template>
  <main class="page">
    <NuxtLink to="/catalogue" class="text-secondary">&larr; Retour au catalogue</NuxtLink>

    <p v-if="pending" class="text-secondary">Chargement...</p>

    <div v-else-if="error" class="error-box">
      <p v-if="error.statusCode === 404">Ce webtoon n'existe pas.</p>
      <template v-else>
        <p>Impossible de charger cette fiche pour le moment.</p>
        <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
      </template>
    </div>

    <article v-else-if="webtoon">
      <h1>{{ webtoon.title }}</h1>
      <p class="text-secondary">{{ webtoon.author }}</p>

      <div v-if="webtoon.genres.length > 0" class="genres">
        <AppBadge v-for="genre in webtoon.genres" :key="genre.id">{{ genre.name }}</AppBadge>
      </div>

      <p v-if="webtoon.description">{{ webtoon.description }}</p>
      <p v-if="webtoon.chaptersTotal" class="text-secondary">
        {{ webtoon.chaptersTotal }} chapitres au total
      </p>

      <a v-if="webtoon.link" :href="webtoon.link" target="_blank" rel="noopener">
        <AppButton variant="outline">Lire ce webtoon</AppButton>
      </a>
    </article>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 720px;
  margin: 0 auto;
}

article {
  margin-top: var(--spacing-lg);
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin: var(--spacing-sm) 0;
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
