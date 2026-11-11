<script setup lang="ts">
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'
import { filterAndSortReadingList, type ReadingListSort } from '~/utils/reading-list'

const apiBase = useApiBase()
const toast = useToast()
const {
  data: entries,
  pending,
  error,
  refresh,
} = await useFetch<UserWebtoon[]>(`${apiBase}/user/list`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : partagee
  // entre le SSR et l'hydratation.
  key: 'user-list',
})

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

const statusFilterOptions = [{ value: '', label: 'Tous les statuts' }, ...statusOptions]

// Filtrage et tri cote client (liste personnelle, petite) : logique dans
// utils/reading-list.ts, fonction pure testable.
const search = ref('')
const debouncedSearch = useDebouncedRef(search, 300)
const statusFilter = ref<UserWebtoonStatus | ''>('')
const genreFilter = ref('')
// Chaine dans le select ('' = toutes les notes), convertie en nombre pour le filtre.
const minRatingFilter = ref('')
const sort = ref<ReadingListSort>('title')

const minRatingOptions = [
  { value: '', label: 'Toutes les notes' },
  ...[5, 6, 7, 8, 9].map((n) => ({ value: String(n), label: `${String(n)} et plus` })),
]

const sortOptions = [
  { value: 'title', label: 'Titre (A-Z)' },
  { value: 'title-desc', label: 'Titre (Z-A)' },
  { value: 'recent', label: "Date d'ajout (plus récent d'abord)" },
  { value: 'oldest', label: "Date d'ajout (plus ancien d'abord)" },
  { value: 'rating', label: 'Note (décroissante)' },
  { value: 'rating-asc', label: 'Note (croissante)' },
  { value: 'progress', label: 'Progression (%)' },
]

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
      .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
      .map(([value, label]) => ({ value, label })),
  ]
})

const filteredEntries = computed(() =>
  filterAndSortReadingList(entries.value ?? [], {
    search: debouncedSearch.value,
    status: statusFilter.value,
    genreId: genreFilter.value,
    minRating: minRatingFilter.value === '' ? null : Number(minRatingFilter.value),
    sort: sort.value,
  })
)

const hasActiveFilters = computed(
  () =>
    !!(
      search.value ||
      statusFilter.value ||
      genreFilter.value ||
      minRatingFilter.value ||
      sort.value !== 'title'
    )
)

function resetFilters() {
  search.value = ''
  statusFilter.value = ''
  genreFilter.value = ''
  minRatingFilter.value = ''
  sort.value = 'title'
}

// Ids des entrees ayant une requete en vol : une seule requete a la fois par
// entree (+1, saisie directe, statut, edition), sans bloquer les autres cartes.
const pendingIds = reactive(new Set<string>())

async function handleStatusChange(entry: UserWebtoon, newStatus: UserWebtoonStatus) {
  if (pendingIds.has(entry.id)) return
  pendingIds.add(entry.id)
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${entry.id}`, {
      method: 'PUT',
      body: { status: newStatus },
    })
    // Patch local plutot que refresh() : refresh repasse pending a true, ce
    // qui demonterait toute la liste et ferait perdre le focus.
    patchEntry(entry.id, updated)
  } catch {
    toast.error('Le changement de statut a échoué. Réessaie dans un instant.')
  } finally {
    pendingIds.delete(entry.id)
  }
}

function canAddChapter(entry: UserWebtoon) {
  const total = entry.webtoon.chaptersTotal
  return total === null || entry.chaptersRead < total
}

// data de useFetch est un shallowRef (Nuxt 4) : modifier une entree en place
// ne declencherait pas de rendu, on remplace donc le tableau. webtoon est
// toujours conserve : les reponses de PUT/PATCH ne prechargent pas ses genres
// (a la difference de GET /user/list).
function patchEntry(id: string, patch: Partial<UserWebtoon>) {
  entries.value = (entries.value ?? []).map((entry) =>
    entry.id === id ? { ...entry, ...patch, webtoon: entry.webtoon } : entry
  )
}

// Mise a jour optimiste (US-06) : la carte affiche la nouvelle valeur tout de
// suite, puis prend la reponse serveur (le statut peut passer a "completed")
// ou revient a l'ancienne valeur en cas d'echec.
async function updateProgress(entry: UserWebtoon, chaptersRead: number) {
  if (pendingIds.has(entry.id)) return
  pendingIds.add(entry.id)
  const previous = entry.chaptersRead
  patchEntry(entry.id, { chaptersRead })
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${entry.id}/progress`, {
      method: 'PATCH',
      body: { chaptersRead },
    })
    patchEntry(entry.id, updated)
  } catch (error) {
    // Retour arriere seulement si l'entree n'a pas change entre-temps : toute
    // reponse serveur appliquee modifie updatedAt (et une valeur differente
    // de chaptersRead signale une autre modification locale).
    const current = entries.value?.find((item) => item.id === entry.id)
    if (current && current.updatedAt === entry.updatedAt && current.chaptersRead === chaptersRead) {
      patchEntry(entry.id, { chaptersRead: previous })
    }
    toast.error(
      extractBusinessError(error) ??
        Object.values(extractValidationErrors(error))[0] ??
        'La mise à jour de la progression a échoué. Réessaie dans un instant.'
    )
  } finally {
    pendingIds.delete(entry.id)
  }
}

// Edition d'une entree (US-07)
const editOpen = ref(false)
const editTarget = ref<UserWebtoon | null>(null)
const editErrors = ref<Record<string, string>>({})
const editGlobalError = ref('')
const saving = ref(false)

function openEdit(entry: UserWebtoon) {
  editTarget.value = entry
  editErrors.value = {}
  editGlobalError.value = ''
  editOpen.value = true
}

async function handleEditSubmit(payload: ReadingEntryPayload) {
  if (!editTarget.value || saving.value || pendingIds.has(editTarget.value.id)) return
  const id = editTarget.value.id
  pendingIds.add(id)
  saving.value = true
  editErrors.value = {}
  editGlobalError.value = ''
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${id}`, {
      method: 'PUT',
      body: payload,
    })
    patchEntry(updated.id, updated)
    editOpen.value = false
    toast.success('Ta lecture a été mise à jour.')
  } catch (error) {
    // Erreur metier sans champ (chapitres > total) en message global, erreurs
    // VineJS sous leur champ, tout le reste en message generique.
    const businessError = extractBusinessError(error)
    if (businessError) {
      editGlobalError.value = businessError
    } else {
      editErrors.value = extractValidationErrors(error)
      if (Object.keys(editErrors.value).length === 0) {
        editGlobalError.value = "L'enregistrement a échoué. Réessaie dans un instant."
      }
    }
  } finally {
    saving.value = false
    pendingIds.delete(id)
  }
}

// Retrait de la liste (US-08)
const removeOpen = ref(false)
const removeTarget = ref<UserWebtoon | null>(null)
const removing = ref(false)
const headingRef = ref<HTMLElement | null>(null)

function openRemove(entry: UserWebtoon) {
  removeTarget.value = entry
  removeOpen.value = true
}

async function handleRemove() {
  if (!removeTarget.value || removing.value) return
  removing.value = true
  const id = removeTarget.value.id
  try {
    await $fetch(`${apiBase}/user/list/${id}`, { method: 'DELETE' })
    entries.value = (entries.value ?? []).filter((entry) => entry.id !== id)
    removeOpen.value = false
    toast.success('Webtoon retiré de ta liste.')
    // Le bouton declencheur a disparu avec la carte : on place le focus sur
    // le titre de la page pour ne pas le perdre.
    await nextTick()
    headingRef.value?.focus()
  } catch {
    toast.error('Le retrait a échoué. Réessaie dans un instant.')
  } finally {
    removing.value = false
  }
}

function formatRating(rating: number) {
  return String(rating).replace('.', ',')
}
</script>

<template>
  <main class="page">
    <h1 ref="headingRef" tabindex="-1">Ma liste</h1>

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
      <section class="filters" aria-label="Recherche, filtres et tri">
        <AppInput
          v-model="search"
          class="filters__search"
          label="Rechercher (titre ou auteur)"
          type="search"
          placeholder="Ex. : Solo Leveling"
        />
        <AppSelect v-model="statusFilter" label="Statut" :options="statusFilterOptions" />
        <AppSelect v-model="genreFilter" label="Genre" :options="genreFilterOptions" />
        <AppSelect v-model="minRatingFilter" label="Note minimale" :options="minRatingOptions" />
        <AppSelect v-model="sort" label="Trier par" :options="sortOptions" />
      </section>

      <div class="toolbar">
        <p class="toolbar__count" aria-live="polite">
          {{ filteredEntries.length }} {{ filteredEntries.length > 1 ? 'webtoons' : 'webtoon' }}
        </p>
        <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
          Réinitialiser
        </AppButton>
      </div>

      <p v-if="filteredEntries.length === 0" class="text-secondary">
        Aucun webtoon ne correspond à ces critères.
      </p>

      <div v-else class="grid">
        <AppCard
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="entry-card"
        >
          <template #header>
            <!-- Le lien du titre s'etend a toute la carte (::after, voir le
                 style) ; les controles sont places au-dessus. -->
            <div class="entry-head">
              <AppCover
                :src="entry.webtoon.coverUrl"
                :title="entry.webtoon.title"
                class="entry-cover"
              />
              <h3>
                <NuxtLink :to="`/catalogue/${entry.webtoonId}`" class="entry-link">
                  {{ entry.webtoon.title }}
                </NuxtLink>
              </h3>
            </div>
          </template>

          <p class="text-secondary">{{ entry.webtoon.author }}</p>

          <div class="progress">
            <p class="text-secondary">
              <template v-if="entry.webtoon.chaptersTotal">
                {{ entry.chaptersRead }} / {{ entry.webtoon.chaptersTotal }} chapitres
              </template>
              <template v-else>{{ entry.chaptersRead }} chapitres lus</template>
            </p>
            <AppButton
              variant="outline"
              size="sm"
              :disabled="!canAddChapter(entry)"
              :aria-disabled="pendingIds.has(entry.id)"
              @click="updateProgress(entry, entry.chaptersRead + 1)"
            >
              +1 chapitre
            </AppButton>
          </div>

          <ReadingProgressInput
            :chapters-read="entry.chaptersRead"
            :chapters-total="entry.webtoon.chaptersTotal"
            :disabled="pendingIds.has(entry.id)"
            @submit="(value) => updateProgress(entry, value)"
          />

          <dl
            v-if="entry.rating !== null || entry.startedAt || entry.finishedAt"
            class="details"
          >
            <template v-if="entry.rating !== null">
              <dt>Note</dt>
              <dd>{{ formatRating(entry.rating) }} / 10</dd>
            </template>
            <template v-if="entry.startedAt">
              <dt>Début</dt>
              <dd>{{ formatDate(entry.startedAt) }}</dd>
            </template>
            <template v-if="entry.finishedAt">
              <dt>Fin</dt>
              <dd>{{ formatDate(entry.finishedAt) }}</dd>
            </template>
          </dl>
          <!-- Tronque visuellement (CSS line-clamp) : le texte complet reste
               dans le DOM, lu en entier par les lecteurs d'ecran. -->
          <p v-if="entry.comment" class="comment">{{ entry.comment }}</p>

          <div v-if="entry.webtoon.genres.length > 0" class="genres">
            <AppBadge v-for="genre in entry.webtoon.genres" :key="genre.id">
              {{ genre.name }}
            </AppBadge>
          </div>

          <!-- disabled natif (pas aria-disabled) : un <select> aria-disabled
               changerait quand meme de valeur a l'ecran. -->
          <AppSelect
            label="Statut"
            :model-value="entry.status"
            :options="statusOptions"
            :disabled="pendingIds.has(entry.id)"
            @update:model-value="(value) => handleStatusChange(entry, value as UserWebtoonStatus)"
          />

          <div class="actions">
            <AppButton
              variant="outline"
              size="sm"
              :aria-label="`Modifier ma lecture de ${entry.webtoon.title}`"
              @click="openEdit(entry)"
            >
              Modifier
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              :aria-label="`Retirer ${entry.webtoon.title} de ma liste`"
              @click="openRemove(entry)"
            >
              Retirer
            </AppButton>
          </div>
        </AppCard>
      </div>
    </template>

    <AppModal v-model:open="editOpen" :persistent="saving">
      <template #title>Modifier ma lecture</template>
      <p v-if="editTarget" class="text-secondary modal-subtitle">{{ editTarget.webtoon.title }}</p>
      <ReadingEntryForm
        v-if="editTarget"
        :key="editTarget.id"
        :entry="editTarget"
        :errors="editErrors"
        :global-error="editGlobalError"
        :submitting="saving"
        @submit="handleEditSubmit"
        @cancel="editOpen = false"
      />
    </AppModal>

    <AppModal v-model:open="removeOpen" :persistent="removing">
      <template #title>Retirer ce webtoon de ta liste ?</template>
      <p>
        Ta progression, ta note et ton commentaire sur {{ removeTarget?.webtoon.title }} seront
        perdus. Le webtoon reste dans le catalogue.
      </p>
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :aria-disabled="removing"
          @click="!removing && (removeOpen = false)"
        >
          Annuler
        </AppButton>
        <AppButton variant="secondary" size="sm" :aria-disabled="removing" @click="handleRemove">
          {{ removing ? 'Retrait...' : 'Retirer' }}
        </AppButton>
      </template>
    </AppModal>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 1100px;
  margin: 0 auto;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.entry-card:hover {
  border-color: var(--color-primary);
  transform: scale(1.02);
}

.entry-head {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

/* Vignette : la carte porte deja beaucoup de controles, une couverture
   pleine largeur l'allongerait trop. */
.entry-cover {
  flex: 0 0 72px;
}

.entry-head h3 {
  min-width: 0;
  overflow-wrap: anywhere;
}

.entry-link {
  color: inherit;
  text-decoration: none;
}

/* Rend toute la carte cliquable sans imbriquer de controles dans un lien. */
.entry-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.entry-link:focus-visible {
  outline: none;
}

.entry-card:has(.entry-link:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.entry-card :deep(.app-card__body) {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

/* Les controles passent au-dessus du ::after du lien de titre : ils gardent
   leur propre comportement au clic au lieu d'ouvrir la fiche. */
.entry-card :deep(.app-select),
.entry-card :deep(.app-input),
.entry-card :deep(.app-button) {
  position: relative;
  z-index: 1;
}

.progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.progress p {
  margin: 0;
}

.details {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-xs) var(--spacing-sm);
  margin: 0;
  font-size: 14px;
}

.details dt {
  font-weight: 600;
}

.details dd {
  margin: 0;
}

.comment {
  margin: 0;
  font-size: 14px;
  font-style: italic;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: auto;
}

.modal-subtitle {
  margin: 0 0 var(--spacing-md);
}

h1:focus {
  outline: none;
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
