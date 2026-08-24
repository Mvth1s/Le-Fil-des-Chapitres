<script setup lang="ts">
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'

const apiBase = useApiBase()
const router = useRouter()
const {
  data: entries,
  pending,
  error,
  refresh,
} = await useFetch<UserWebtoon[]>(`${apiBase}/user/list`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : necessaire
  // car apiBase differe entre le SSR et le navigateur.
  key: 'user-list',
})

const STATUS_LABELS: Record<UserWebtoonStatus, string> = {
  reading: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  dropped: 'Abandonné',
  plan_to_read: 'À lire',
}

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

const statusFilterOptions = [{ value: '', label: 'Tous les statuts' }, ...statusOptions]

const statusFilter = ref('')
const genreFilter = ref('')

// Les genres proposes au filtre sont ceux presents dans la liste de
// l'utilisateur, pas le referentiel complet : inutile de proposer un genre
// qui ne donnerait jamais aucun resultat.
const genreFilterOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const entry of entries.value ?? []) {
    for (const genre of entry.webtoon.genres) {
      seen.set(genre.id, genre.name)
    }
  }
  return [
    { value: '', label: 'Tous les genres' },
    ...[...seen.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ]
})

const filteredEntries = computed(() => {
  return (entries.value ?? []).filter((entry) => {
    const matchesStatus = statusFilter.value === '' || entry.status === statusFilter.value
    const matchesGenre =
      genreFilter.value === '' ||
      entry.webtoon.genres.some((genre) => genre.id === genreFilter.value)
    return matchesStatus && matchesGenre
  })
})

function goToDetail(webtoonId: string) {
  void router.push(`/catalogue/${webtoonId}`)
}

const updatingId = ref<string | null>(null)

async function handleStatusChange(entry: UserWebtoon, newStatus: string) {
  updatingId.value = entry.id
  try {
    await $fetch(`${apiBase}/user/list/${entry.id}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    await refresh()
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <main class="page">
    <h1>Ma liste</h1>

    <p v-if="pending" class="text-secondary">Chargement de la liste...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger la liste pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <p v-else-if="entries?.length === 0" class="text-secondary">
      Ta liste est vide pour l'instant. Ajoute des webtoons depuis le
      <NuxtLink to="/catalogue">catalogue</NuxtLink>.
    </p>

    <template v-else>
      <div class="filters">
        <AppSelect v-model="statusFilter" label="Statut" :options="statusFilterOptions" />
        <AppSelect v-model="genreFilter" label="Genre" :options="genreFilterOptions" />
      </div>

      <p v-if="filteredEntries.length === 0" class="text-secondary">
        Aucun webtoon ne correspond a ce filtre.
      </p>

      <div v-else class="grid">
        <AppCard
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="entry-card"
          role="link"
          tabindex="0"
          @click="goToDetail(entry.webtoonId)"
          @keydown.enter="goToDetail(entry.webtoonId)"
        >
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

          <div v-if="entry.webtoon.genres.length > 0" class="genres">
            <AppBadge v-for="genre in entry.webtoon.genres" :key="genre.id">
              {{ genre.name }}
            </AppBadge>
          </div>

          <!-- @click.stop : un <select> est du contenu interactif, il ne peut
               pas etre imbrique dans un lien (HTML invalide, comportement
               clavier/lecteur d'ecran impredictible). La carte entiere navigue
               au clic, sauf ici ou le select garde son propre comportement. -->
          <AppSelect
            label="Statut"
            :model-value="entry.status"
            :options="statusOptions"
            :disabled="updatingId === entry.id"
            @click.stop
            @update:model-value="(value) => handleStatusChange(entry, value as UserWebtoonStatus)"
          />
        </AppCard>
      </div>
    </template>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1100px;
  margin: 0 auto;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  max-width: 480px;
}

.filters > * {
  flex: 1;
  min-width: 180px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.entry-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.entry-card:hover {
  border-color: var(--color-primary);
  transform: scale(1.02);
}

.entry-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.entry-card :deep(.app-card__body) {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

/* Le select de statut reste une commande independante de la navigation de
   la carte (voir @click.stop dans le template) : curseur normal, pas de
   confusion avec le clic-pour-naviguer du reste de la carte. */
.entry-card :deep(.app-select) {
  cursor: auto;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
