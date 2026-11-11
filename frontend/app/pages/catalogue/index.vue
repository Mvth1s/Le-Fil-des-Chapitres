<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'
import { USER_WEBTOON_STATUSES, type UserWebtoon } from '~/types/user-webtoon'
import { STATUS_LABELS } from '~/utils/status-labels'
import {
  NOT_IN_LIST,
  filterAndSortWebtoons,
  type CatalogueCriteria,
  type CatalogueSort,
} from '~/utils/catalogue'

const apiBase = useApiBase()
// Les deux appels sont lances en parallele (Promise.all) plutot qu'en serie.
const [
  { data: webtoons, pending, error, refresh },
  // Statut de lecture par webtoon, pour le filtre "statut". Un echec de cet
  // appel ne bloque pas le catalogue : seul le filtre de statut est desactive.
  { data: entries, error: listError },
] = await Promise.all([
  useFetch<Webtoon[]>(`${apiBase}/webtoons`, {
    // Cle explicite : par defaut useFetch derive sa cle de l'URL. L'URL est
    // aujourd'hui identique en SSR et dans le navigateur ("/api", voir
    // useApiBase()), mais une cle stable garantit que le client retrouve
    // toujours les donnees transferees par le SSR (sinon "Hydration node
    // mismatch").
    key: 'webtoons-list',
  }),
  useFetch<UserWebtoon[]>(`${apiBase}/user/list`, { key: 'user-list' }),
])
const statusByWebtoonId = computed(
  () => new Map((entries.value ?? []).map((entry) => [entry.webtoonId, entry.status]))
)

// Filtrage cote client : le catalogue est petit (usage personnel), un
// filtrage serveur n'apporterait rien.
const search = ref('')
const debouncedSearch = useDebouncedRef(search, 300)
const genreId = ref('')
const status = ref<CatalogueCriteria['status']>('')
const author = ref('')
const sort = ref<CatalogueSort>('title')

const genreOptions = computed(() => {
  const genres = new Map<string, string>()
  for (const webtoon of webtoons.value ?? []) {
    for (const genre of webtoon.genres) genres.set(genre.id, genre.name)
  }
  const options = [...genres]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  return [{ value: '', label: 'Tous les genres' }, ...options]
})

const authorOptions = computed(() => {
  const authors = [...new Set((webtoons.value ?? []).map((webtoon) => webtoon.author))]
  authors.sort((a, b) => a.localeCompare(b, 'fr'))
  return [
    { value: '', label: 'Tous les auteurs' },
    ...authors.map((name) => ({ value: name, label: name })),
  ]
})

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  ...USER_WEBTOON_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
  { value: NOT_IN_LIST, label: 'Pas dans ma liste' },
]

const sortOptions = [
  { value: 'title', label: 'Titre (A-Z)' },
  { value: 'recent', label: "Date d'ajout (plus récent)" },
  { value: 'chapters', label: 'Nombre de chapitres' },
]

const results = computed(() =>
  filterAndSortWebtoons(
    webtoons.value ?? [],
    {
      search: debouncedSearch.value,
      genreId: genreId.value,
      status: status.value,
      author: author.value,
      sort: sort.value,
    },
    statusByWebtoonId.value
  )
)

const hasActiveFilters = computed(
  () => !!(search.value || genreId.value || status.value || author.value || sort.value !== 'title')
)

function resetFilters() {
  search.value = ''
  genreId.value = ''
  status.value = ''
  author.value = ''
  sort.value = 'title'
}

// Vue grille / liste memorisee dans l'URL (?vue=liste) : survit au
// rechargement et au partage du lien, sans souci d'hydratation SSR.
const route = useRoute()
const router = useRouter()
const view = computed(() => (route.query.vue === 'liste' ? 'list' : 'grid'))
function setView(next: 'grid' | 'list') {
  void router.replace({ query: { ...route.query, vue: next === 'list' ? 'liste' : undefined } })
}
</script>

<template>
  <main class="page">
    <div class="page-header">
      <h1>Catalogue</h1>
      <AppButton to="/catalogue/new" variant="outline" size="sm">Ajouter un webtoon</AppButton>
    </div>

    <p v-if="pending" class="text-secondary">Chargement du catalogue...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger le catalogue pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <p v-else-if="webtoons?.length === 0" class="text-secondary">
      Aucun webtoon dans le catalogue pour l'instant.
    </p>

    <template v-else>
      <section class="filters" aria-label="Recherche et filtres">
        <AppInput
          v-model="search"
          class="filters__search"
          label="Rechercher (titre ou auteur)"
          type="search"
          placeholder="Ex. : Solo Leveling"
        />
        <AppSelect v-model="genreId" label="Genre" :options="genreOptions" />
        <AppSelect
          v-model="status"
          label="Statut de lecture"
          :options="statusOptions"
          :disabled="!!listError"
        />
        <AppSelect v-model="author" label="Auteur" :options="authorOptions" />
        <AppSelect v-model="sort" label="Trier par" :options="sortOptions" />
      </section>
      <p v-if="listError" class="text-secondary" role="status">
        Liste de lecture indisponible : le filtre par statut est désactivé.
      </p>

      <div class="toolbar">
        <p class="toolbar__count" aria-live="polite">
          {{ results.length }} {{ results.length > 1 ? 'titres' : 'titre' }}
        </p>
        <div class="toolbar__actions">
          <AppButton
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            @click="resetFilters"
          >
            Réinitialiser
          </AppButton>
          <div class="view-toggle" role="group" aria-label="Affichage">
            <AppButton
              :variant="view === 'grid' ? 'primary' : 'outline'"
              size="sm"
              :aria-pressed="view === 'grid'"
              @click="setView('grid')"
            >
              Grille
            </AppButton>
            <AppButton
              :variant="view === 'list' ? 'primary' : 'outline'"
              size="sm"
              :aria-pressed="view === 'list'"
              @click="setView('list')"
            >
              Liste
            </AppButton>
          </div>
        </div>
      </div>

      <p v-if="results.length === 0" class="text-secondary">
        Aucun titre ne correspond à ces critères.
      </p>

      <div v-else-if="view === 'grid'" class="grid">
        <NuxtLink
          v-for="webtoon in results"
          :key="webtoon.id"
          :to="`/catalogue/${webtoon.id}`"
          class="card-link"
        >
          <AppCard>
            <template #header>
              <AppCover :src="webtoon.coverUrl" :title="webtoon.title" class="card-cover" />
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

      <div
        v-else
        class="table-wrapper"
        tabindex="0"
        role="region"
        aria-label="Catalogue en liste"
      >
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Titre</th>
              <th scope="col">Auteur</th>
              <th scope="col">Chapitres</th>
              <th scope="col">Genres</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="webtoon in results" :key="webtoon.id">
              <td>
                <NuxtLink :to="`/catalogue/${webtoon.id}`">{{ webtoon.title }}</NuxtLink>
              </td>
              <td>{{ webtoon.author }}</td>
              <td>{{ webtoon.chaptersTotal ?? '-' }}</td>
              <td>{{ webtoon.genres.map((genre) => genre.name).join(', ') }}</td>
            </tr>
          </tbody>
        </table>
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

.page-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

/* Toute la carte est cliquable : le lien s'affiche en bloc et n'emprunte
   pas l'apparence par defaut des liens (le style vient de AppCard).
   display:flex + height:100% : chaque carte occupe toute la hauteur de sa
   ligne de grille (par defaut deja egale entre les cartes d'une meme
   ligne), au lieu de s'arreter a la hauteur de son propre contenu. */
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

.card-cover {
  margin-bottom: var(--spacing-md);
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
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.filters__search {
  grid-column: 1 / -1;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.toolbar__count {
  margin: 0;
  font-weight: 600;
}

.toolbar__actions,
.view-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.table-wrapper {
  overflow-x: auto;
  margin-top: var(--spacing-lg);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.table a {
  color: var(--color-text);
  font-weight: 600;
}

.table a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
