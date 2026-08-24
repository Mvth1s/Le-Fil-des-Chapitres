<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'

const route = useRoute()
const router = useRouter()
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
} = await useFetch<Webtoon>(`${apiBase}/webtoons/${webtoonId}`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : necessaire
  // car apiBase differe entre le SSR et le navigateur.
  key: `webtoon-${webtoonId}`,
})

const deleting = ref(false)

async function handleDelete() {
  if (!confirm('Supprimer definitivement ce webtoon du catalogue ?')) {
    return
  }
  deleting.value = true
  try {
    await $fetch(`${apiBase}/webtoons/${webtoonId}`, { method: 'DELETE' })
    await router.push('/catalogue')
  } finally {
    deleting.value = false
  }
}
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
      <div class="article-header">
        <h1>{{ webtoon.title }}</h1>
        <div class="article-actions">
          <NuxtLink :to="`/catalogue/${webtoonId}/edit`">
            <AppButton variant="outline" size="sm">Modifier</AppButton>
          </NuxtLink>
          <AppButton variant="ghost" size="sm" :disabled="deleting" @click="handleDelete">
            Supprimer
          </AppButton>
        </div>
      </div>
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

.article-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.article-header h1 {
  margin: 0;
}

.article-actions {
  display: flex;
  gap: var(--spacing-sm);
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
