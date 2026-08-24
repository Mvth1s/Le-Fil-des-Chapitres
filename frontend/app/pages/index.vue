<script setup lang="ts">
import type { Stats } from '~/types/stats'
import type { UserWebtoon } from '~/types/user-webtoon'

const apiBase = useApiBase()
const {
  data: stats,
  pending,
  error,
  refresh,
} = await useFetch<Stats>(`${apiBase}/stats`, {
  // Meme cle que pages/statistiques/index.vue : les deux pages partagent la
  // meme donnee, autant reutiliser le cache plutot que refetcher deux fois.
  key: 'stats',
})

const { data: entries } = await useFetch<UserWebtoon[]>(`${apiBase}/user/list`, {
  // Meme cle que pages/liste/index.vue : voir remarque ci-dessus.
  key: 'user-list',
})

// GET /api/user/list trie deja par updatedAt desc (voir user_list_controller.ts)
// : les 3 premiers webtoons "en cours" sont donc les plus recemment repris.
const readingEntries = computed(() =>
  (entries.value ?? []).filter((entry) => entry.status === 'reading').slice(0, 3)
)
</script>

<template>
  <main class="page">
    <h1>Le Fil des Chapitres</h1>
    <p class="text-muted">Ton suivi de lecture de webtoons.</p>

    <p v-if="pending" class="text-secondary">Chargement...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger le tableau de bord pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <template v-else-if="stats">
      <p v-if="stats.totalWebtoons === 0" class="text-secondary">
        Ta liste est vide pour l'instant. Parcours le
        <NuxtLink to="/catalogue">catalogue</NuxtLink>
        pour commencer a suivre des webtoons.
      </p>

      <div v-else class="tiles">
        <AppCard class="tile">
          <p class="tile__value">{{ stats.totalWebtoons }}</p>
          <p class="text-secondary">Dans ta liste</p>
        </AppCard>
        <AppCard class="tile">
          <p class="tile__value">{{ stats.byStatus.reading }}</p>
          <p class="text-secondary">En cours de lecture</p>
        </AppCard>
        <AppCard class="tile">
          <p class="tile__value">{{ stats.totalChaptersRead }}</p>
          <p class="text-secondary">Chapitres lus</p>
        </AppCard>
      </div>
    </template>

    <div class="quick-links">
      <NuxtLink to="/catalogue">
        <AppButton>Catalogue</AppButton>
      </NuxtLink>
      <NuxtLink to="/liste">
        <AppButton variant="outline">Ma liste</AppButton>
      </NuxtLink>
      <NuxtLink to="/statistiques">
        <AppButton variant="outline">Statistiques</AppButton>
      </NuxtLink>
    </div>

    <section v-if="readingEntries.length > 0" class="section">
      <h2>Reprendre la lecture</h2>
      <div class="grid">
        <NuxtLink
          v-for="entry in readingEntries"
          :key="entry.id"
          :to="`/catalogue/${entry.webtoonId}`"
          class="card-link"
        >
          <AppCard>
            <template #header>
              <h3>{{ entry.webtoon.title }}</h3>
            </template>
            <p class="text-secondary">{{ entry.webtoon.author }}</p>
            <p class="text-secondary">
              <template v-if="entry.webtoon.chaptersTotal">
                {{ entry.chaptersRead }} / {{ entry.webtoon.chaptersTotal }} chapitres
              </template>
              <template v-else>{{ entry.chaptersRead }} chapitres lus</template>
            </p>
          </AppCard>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 960px;
  margin: 0 auto;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.section {
  margin-top: var(--spacing-xl);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

/* Meme pattern que pages/catalogue/index.vue : carte entiere cliquable,
   agrandissement + contour au survol. */
.card-link {
  display: flex;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.card-link :deep(.app-card) {
  display: flex;
  flex-direction: column;
  width: 100%;
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

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
