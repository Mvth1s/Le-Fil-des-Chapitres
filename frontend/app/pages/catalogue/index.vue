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
// Carte de la vue grille : l'entree de liste si le webtoon y est (chip de
// statut, progression, +1), sinon le webtoon seul.
const entryByWebtoonId = computed(
  () => new Map((entries.value ?? []).map((entry) => [entry.webtoonId, entry]))
)
const { increment, pendingIds } = useChapterIncrement(entries)
function handleIncrement(webtoonId: string) {
  const entry = entryByWebtoonId.value.get(webtoonId)
  if (entry) void increment(entry)
}

// Filtrage cote client : le catalogue est petit (usage personnel), un
// filtrage serveur n'apporterait rien.
const route = useRoute()
const router = useRouter()

// Recherche lue dans ?q= (recherche globale du header, decision V8) au
// chargement et a chaque changement d'URL ; en retour, la saisie (debouncee)
// est recopiee dans l'URL par replace, sans empiler d'historique.
function queryText(): string {
  return typeof route.query.q === 'string' ? route.query.q : ''
}
const search = ref(queryText())
const debouncedSearch = useDebouncedRef(search, 300)
// Derniere valeur de q ecrite (ou recue) par la page. Le retour de notre
// propre replace porte cette valeur : on l'ignore, sans ecraser la saisie en
// cours. Comparer a queryText() ne suffit pas : tant que replace n'a pas
// abouti, l'URL porte encore l'ancienne valeur (ex. "abc" tape puis efface
// avant la fin de la navigation : l'effacement etait perdu). Un replace
// interrompu par le suivant est annule par vue-router : pas de retour perime.
let lastQ = queryText()
watch(
  () => route.query.q,
  () => {
    const q = queryText()
    if (q === lastQ) return
    lastQ = q
    search.value = q
  }
)
watch(debouncedSearch, (value) => {
  if (value === lastQ) return
  lastQ = value
  void router.replace({ query: { ...route.query, q: value || undefined } })
})
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
  return [{ value: '', label: 'Tous' }, ...options]
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
const view = computed(() => (route.query.vue === 'liste' ? 'list' : 'grid'))
function setView(next: 'grid' | 'list') {
  // q depuis lastQ : un replace de recherche encore en cours n'est pas perdu.
  void router.replace({
    query: { ...route.query, q: lastQ || undefined, vue: next === 'list' ? 'liste' : undefined },
  })
}
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="La bibliothèque"
      title="Catalogue global"
      subtitle="Tous les webtoons référencés, qu'ils soient dans ta liste ou non. Cherche par titre ou auteur, filtre par genre ou par statut."
    >
      <template #actions>
        <AppButton to="/catalogue/new" class="cta">Ajouter un webtoon</AppButton>
      </template>
    </AppPageHeader>

    <p v-if="pending" class="text-secondary">Chargement du catalogue...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger le catalogue pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <div v-else-if="webtoons?.length === 0" class="empty">
      <h2>Le catalogue est vide</h2>
      <p>Ajoute un premier webtoon pour commencer à construire ta bibliothèque.</p>
      <AppButton to="/catalogue/new" variant="outline" size="sm">Ajouter un webtoon</AppButton>
    </div>

    <template v-else>
      <section class="filters" aria-label="Recherche et filtres">
        <div class="filters__rail">
          <div class="search">
            <label for="catalogue-search" class="sr-only">Rechercher par titre ou auteur</label>
            <svg
              class="search__icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              id="catalogue-search"
              v-model="search"
              class="search__field"
              type="search"
              placeholder="Titre ou auteur..."
            >
          </div>
          <span class="filters__divider" aria-hidden="true" />
          <div class="chips" role="group" aria-label="Genre">
            <button
              v-for="option in genreOptions"
              :key="option.value"
              type="button"
              class="chip"
              :aria-pressed="genreId === option.value"
              @click="genreId = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="filters__selects">
          <AppSelect
            v-model="status"
            label="Statut dans ma liste"
            :options="statusOptions"
            :disabled="!!listError"
          />
          <AppSelect v-model="author" label="Auteur" :options="authorOptions" />
          <AppSelect v-model="sort" label="Trier par" :options="sortOptions" />
        </div>
      </section>
      <p v-if="listError" class="text-secondary" role="status">
        Liste de lecture indisponible : le filtre par statut est désactivé.
      </p>

      <div class="toolbar">
        <p class="toolbar__count" aria-live="polite">
          {{ results.length }} {{ results.length > 1 ? 'titres' : 'titre' }}
        </p>
        <div class="toolbar__actions">
          <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
            Réinitialiser
          </AppButton>
          <div class="chips" role="group" aria-label="Affichage">
            <button
              type="button"
              class="chip"
              :aria-pressed="view === 'grid'"
              @click="setView('grid')"
            >
              Grille
            </button>
            <button
              type="button"
              class="chip"
              :aria-pressed="view === 'list'"
              @click="setView('list')"
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      <div v-if="results.length === 0" class="empty">
        <h2>Aucun résultat</h2>
        <p>Aucun titre ne correspond à ces critères. Essaie un autre terme ou un autre filtre.</p>
        <AppButton variant="outline" size="sm" @click="resetFilters">
          Réinitialiser les filtres
        </AppButton>
      </div>

      <div v-else-if="view === 'grid'" class="wt-grid">
        <WebtoonCard
          v-for="webtoon in results"
          :key="webtoon.id"
          :item="entryByWebtoonId.get(webtoon.id) ?? webtoon"
          :busy="pendingIds.has(entryByWebtoonId.get(webtoon.id)?.id ?? '')"
          @increment="handleIncrement(webtoon.id)"
        />
      </div>

      <div
        v-else
        class="table-wrapper"
        tabindex="0"
        role="region"
        aria-label="Liste des webtoons"
      >
        <table class="table">
          <thead>
            <tr>
              <th scope="col"><span class="sr-only">Couverture</span></th>
              <th scope="col">Titre</th>
              <th scope="col">Auteur</th>
              <th scope="col">Chapitres</th>
              <th scope="col">Genres</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="webtoon in results" :key="webtoon.id">
              <td class="table__cover">
                <AppCover :src="webtoon.coverUrl" :title="webtoon.title" :webtoon-id="webtoon.id" />
              </td>
              <td>
                <NuxtLink :to="`/catalogue/${webtoon.id}`" class="table__title">
                  {{ webtoon.title }}
                </NuxtLink>
              </td>
              <td class="table__author">{{ webtoon.author }}</td>
              <td>{{ webtoon.chaptersTotal ?? '-' }}</td>
              <td>
                <span class="table__tags">
                  <AppGenreTag
                    v-for="genre in webtoon.genres"
                    :key="genre.id"
                    :name="genre.name"
                  />
                </span>
              </td>
              <td>
                <AppStatusChip
                  v-if="statusByWebtoonId.get(webtoon.id)"
                  :status="statusByWebtoonId.get(webtoon.id)!"
                />
                <!-- Liste non chargee : statut inconnu, pas "hors liste". -->
                <span v-else-if="listError" class="table__none">-</span>
                <span v-else class="table__none">Pas dans ma liste</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>
</template>

<style scoped>
/* Bouton dore, texte encre (V5) : 5.03:1, comme le hero de l'accueil. */
.page .cta {
  background-color: var(--color-accent);
  color: var(--color-on-accent);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* .filter-rail du UI kit : recherche, filet, puces de genre ; retour a la
   ligne plutot que defilement (14 genres au plus, tout reste visible). */
.filters__rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 1 300px;
  min-width: 0;
  padding: 6px 14px;
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface);
  color: var(--color-text-soft);
}

.search:focus-within {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.search__icon {
  flex-shrink: 0;
}

/* 16px : evite le zoom automatique de Safari iOS au focus. Le contour de
   focus est porte par .search (focus-within). */
.search__field {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text);
}

.search__field:focus-visible {
  outline: none;
}

.filters__divider {
  width: 1px;
  height: 22px;
  margin: 0 6px;
  background-color: var(--color-line);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* .filter-chip du UI kit en 14px (V5). Actif : dore + texte encre (5.03:1)
   et gras, pour ne pas distinguer l'etat par la seule couleur. */
.chip {
  padding: 6px 14px;
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface);
  font-family: var(--font-body);
  font-size: var(--fs-small);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.chip:hover {
  border-color: var(--color-accent-shade);
}

.chip[aria-pressed='true'] {
  background-color: var(--color-accent);
  border-color: var(--color-accent-shade);
  color: var(--color-on-accent);
  font-weight: 700;
}

.filters__selects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3) var(--space-4);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-5) 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}

.toolbar__count {
  margin: 0;
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text-soft);
}

.toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  text-align: center;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.empty h2 {
  margin: 0;
  font-size: var(--fs-h3);
}

.empty p {
  max-width: 380px;
  margin: 0 0 var(--space-2);
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.table-wrapper {
  overflow-x: auto;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

/* Zone defilable au clavier (tabindex) : contour de focus explicite. */
.table-wrapper:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-small);
}

.table th,
.table td {
  text-align: left;
  vertical-align: middle;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-line-soft);
}

.table th {
  font-weight: 400;
  font-style: italic;
  letter-spacing: var(--letter-tag);
  text-transform: uppercase;
  color: var(--color-text-soft);
  white-space: nowrap;
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.table__cover {
  width: 64px;
}

.table__cover :deep(.app-cover) {
  width: 40px;
  border-radius: var(--radius-xs);
}

.table__title {
  font-weight: 600;
  color: var(--color-text);
}

.table__author,
.table__none {
  font-style: italic;
  color: var(--color-text-soft);
}

.table__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

@media (max-width: 639px) {
  .filters__divider {
    display: none;
  }

  .search {
    flex-basis: 100%;
  }
}
</style>
