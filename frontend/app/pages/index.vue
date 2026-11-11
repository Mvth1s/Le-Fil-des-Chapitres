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

const { increment, pendingIds } = useChapterIncrement(entries)

// Patch local pour l'affichage immediat, puis $fetch en arriere-plan pour
// resynchroniser la cle 'stats' partagee avec /statistiques (topRated...) :
// refresh() repasserait pending a true et masquerait le tableau de bord.
async function handleIncrement(entry: UserWebtoon) {
  const updated = await increment(entry)
  if (!updated || !stats.value) return
  const byStatus = { ...stats.value.byStatus }
  byStatus[entry.status] -= 1
  byStatus[updated.status] += 1
  stats.value = {
    ...stats.value,
    totalChaptersRead: stats.value.totalChaptersRead + updated.chaptersRead - entry.chaptersRead,
    byStatus,
  }
  $fetch<Stats>(`${apiBase}/stats`)
    .then((fresh) => {
      stats.value = fresh
    })
    // Echec silencieux : le patch local reste affiche, /statistiques refetch a la navigation.
    .catch(() => {})
}
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
      <AppButton to="/catalogue">Catalogue</AppButton>
      <AppButton to="/liste" variant="outline">Ma liste</AppButton>
      <AppButton to="/statistiques" variant="outline">Statistiques</AppButton>
    </div>

    <section v-if="readingEntries.length > 0" class="section">
      <h2>Reprendre la lecture</h2>
      <div class="wt-grid grid">
        <WebtoonCard
          v-for="entry in readingEntries"
          :key="entry.id"
          :item="entry"
          :busy="pendingIds.has(entry.id)"
          @increment="handleIncrement(entry)"
        />
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
  margin-top: var(--spacing-md);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
