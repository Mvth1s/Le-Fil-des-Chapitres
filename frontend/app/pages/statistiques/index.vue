<script setup lang="ts">
import type { Stats } from '~/types/stats'
import { USER_WEBTOON_STATUSES } from '~/types/user-webtoon'

const apiBase = useApiBase()
const {
  data: stats,
  pending,
  error,
  refresh,
} = await useFetch<Stats>(`${apiBase}/stats`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : necessaire
  // car apiBase differe entre le SSR et le navigateur.
  key: 'stats',
})
</script>

<template>
  <main class="page">
    <h1>Statistiques</h1>

    <p v-if="pending" class="text-secondary">Chargement des statistiques...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger les statistiques pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <template v-else-if="stats">
      <div class="tiles">
        <AppCard class="tile">
          <p class="tile__value">{{ stats.totalWebtoons }}</p>
          <p class="text-secondary">Webtoons dans la liste</p>
        </AppCard>
        <AppCard class="tile">
          <p class="tile__value">{{ stats.totalChaptersRead }}</p>
          <p class="text-secondary">Chapitres lus au total</p>
        </AppCard>
      </div>

      <section class="section">
        <h2>Par statut</h2>
        <ul class="status-list">
          <li v-for="status in USER_WEBTOON_STATUSES" :key="status" class="status-list__item">
            <AppBadge :variant="status">{{ STATUS_LABELS[status] }}</AppBadge>
            <span class="text-secondary">{{ stats.byStatus[status] }}</span>
          </li>
        </ul>
      </section>

      <section v-if="stats.topGenres.length > 0" class="section">
        <h2>Genres les plus lus</h2>
        <ul class="genre-list">
          <li v-for="genre in stats.topGenres" :key="genre.slug" class="genre-list__item">
            <AppBadge>{{ genre.name }}</AppBadge>
            <span class="text-secondary">{{ genre.count }} webtoon(s)</span>
          </li>
        </ul>
      </section>

      <section v-if="stats.topRated.length > 0" class="section">
        <h2>Les mieux notés</h2>
        <ul class="rated-list">
          <li v-for="entry in stats.topRated" :key="entry.id" class="rated-list__item">
            <NuxtLink :to="`/catalogue/${entry.webtoon.id}`" class="rated-list__link">
              {{ entry.webtoon.title }}
            </NuxtLink>
            <span class="text-secondary">{{ entry.webtoon.author }}</span>
            <span class="rated-list__rating">{{ entry.rating }}/10</span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 720px;
  margin: 0 auto;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.tile {
  text-align: center;
}

.tile__value {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 40px;
  color: var(--color-primary);
  margin: 0;
}

.section {
  margin-top: var(--spacing-xl);
}

.status-list,
.genre-list,
.rated-list {
  list-style: none;
  margin: var(--spacing-md) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-list__item,
.genre-list__item,
.rated-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.rated-list__link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}

.rated-list__link:hover {
  text-decoration: underline;
}

.rated-list__rating {
  font-weight: 700;
  color: var(--color-primary);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
