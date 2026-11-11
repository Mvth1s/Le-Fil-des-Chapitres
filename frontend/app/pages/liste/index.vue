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

// Onglets de statut (decision V7), dans l'ordre du UI kit. '' = tous.
const tabs: Array<{ value: UserWebtoonStatus | ''; label: string; empty: string }> = [
  { value: '', label: 'Tous', empty: '' },
  { value: 'reading', label: 'En cours', empty: 'Aucune lecture en cours' },
  { value: 'completed', label: 'Terminés', empty: 'Aucun titre terminé' },
  { value: 'on_hold', label: 'En pause', empty: 'Aucun titre en pause' },
  { value: 'plan_to_read', label: 'À lire', empty: 'Aucun titre à lire' },
  { value: 'dropped', label: 'Abandonnés', empty: 'Aucun titre abandonné' },
]
const statusFilter = ref<UserWebtoonStatus | ''>('')
const activeTab = computed(() => tabs.find((tab) => tab.value === statusFilter.value) ?? tabs[0]!)

// Compteurs sur la liste complete, avant recherche et autres filtres.
const tabCounts = computed(() => {
  const counts: Record<string, number> = { '': entries.value?.length ?? 0 }
  for (const entry of entries.value ?? []) counts[entry.status] = (counts[entry.status] ?? 0) + 1
  return counts
})

// Filtrage et tri cote client (liste personnelle, petite) : logique dans
// utils/reading-list.ts, fonction pure testable.
const search = ref('')
const debouncedSearch = useDebouncedRef(search, 300)
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

// L'onglet n'est pas un filtre a reinitialiser : c'est la vue choisie.
const hasActiveFilters = computed(
  () => !!(search.value || genreFilter.value || minRatingFilter.value || sort.value !== 'title')
)

function resetFilters() {
  search.value = ''
  genreFilter.value = ''
  minRatingFilter.value = ''
  sort.value = 'title'
}

// "+1 chapitre" partage avec l'accueil et le catalogue. pendingIds sert aussi
// a l'edition : une seule requete a la fois par entree.
const { increment, pendingIds } = useChapterIncrement(entries)

// data de useFetch est un shallowRef (Nuxt 4) : modifier une entree en place
// ne declencherait pas de rendu, on remplace donc le tableau. webtoon est
// toujours conserve : la reponse de PUT ne precharge pas ses genres
// (a la difference de GET /user/list).
function patchEntry(id: string, patch: Partial<UserWebtoon>) {
  entries.value = (entries.value ?? []).map((entry) =>
    entry.id === id ? { ...entry, ...patch, webtoon: entry.webtoon } : entry
  )
}

const pageRef = ref<HTMLElement | null>(null)
const announcement = ref('')

function indexInView(id: string) {
  return filteredEntries.value.findIndex((entry) => entry.id === id)
}

// Le bouton qui avait le focus a disparu (carte sortie de la vue apres
// edition, +1 ou retrait ; ou +1 masque a la fin de la lecture) : focus sur le
// bouton titre de la carte a cet index (ou la precedente), sinon sur l'onglet
// actif, sinon sur l'action de l'etat vide.
async function focusCardAt(index: number, message: string) {
  announcement.value = message
  await nextTick()
  const root = pageRef.value
  const cards = root?.querySelectorAll<HTMLElement>('.wt-card__open') ?? []
  const target =
    cards[index] ??
    cards[index - 1] ??
    root?.querySelector<HTMLElement>('.tab[aria-pressed="true"], .empty a, .empty button')
  target?.focus()
}

async function handleIncrement(entry: UserWebtoon) {
  const index = indexInView(entry.id)
  const updated = await increment(entry)
  // Toujours "reading" : le bouton +1 est encore la, le focus aussi.
  if (!updated || updated.status === 'reading') return
  const newIndex = indexInView(entry.id)
  await focusCardAt(
    newIndex === -1 ? index : newIndex,
    newIndex === -1
      ? `${entry.webtoon.title} : ${STATUS_LABELS[updated.status].toLowerCase()}, retiré de l'onglet ${activeTab.value.label}.`
      : `${entry.webtoon.title} : ${STATUS_LABELS[updated.status].toLowerCase()}.`
  )
}

// Edition d'une entree (US-07) : modale ouverte au clic sur la carte.
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
  const { id, webtoon } = editTarget.value
  const index = indexInView(id)
  pendingIds.add(id)
  saving.value = true
  editErrors.value = {}
  editGlobalError.value = ''
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${id}`, {
      method: 'PUT',
      body: payload,
    })
    // Patch local plutot que refresh() : refresh repasse pending a true, ce
    // qui demonterait toute la liste et ferait perdre le focus.
    patchEntry(updated.id, updated)
    editOpen.value = false
    toast.success('Ta lecture a été mise à jour.')
    if (indexInView(id) === -1) {
      await focusCardAt(index, `${webtoon.title} ne figure plus dans cette vue.`)
    }
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

// Retrait de la liste (US-08), demande depuis la modale d'edition.
const removeOpen = ref(false)
const removing = ref(false)

// Une modale a la fois (le piege a focus de chacune ecoute document) : on
// ferme l'edition, qui rend le focus a la carte, avant d'ouvrir la
// confirmation, qui le rendra a son tour a la carte en cas d'annulation.
async function askRemove() {
  editOpen.value = false
  await nextTick()
  removeOpen.value = true
}

async function handleRemove() {
  if (!editTarget.value || removing.value) return
  removing.value = true
  const id = editTarget.value.id
  const index = indexInView(id)
  try {
    await $fetch(`${apiBase}/user/list/${id}`, { method: 'DELETE' })
    entries.value = (entries.value ?? []).filter((entry) => entry.id !== id)
    removeOpen.value = false
    toast.success('Webtoon retiré de ta liste.')
    await focusCardAt(index, '')
  } catch {
    toast.error('Le retrait a échoué. Réessaie dans un instant.')
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <main ref="pageRef" class="page">
    <AppPageHeader
      eyebrow="Ton fil"
      title="Ma liste"
      subtitle="Ta progression, tes statuts, tes notes. Le bouton +1 chapitre met à jour ton avancée en un clic ; ouvre une carte pour modifier le reste."
    />

    <p v-if="pending" class="text-secondary">Chargement de la liste...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger la liste pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <div v-else-if="entries?.length === 0" class="empty">
      <h2>Ta liste est vide</h2>
      <p>Ajoute des webtoons depuis le catalogue pour suivre ta progression.</p>
      <AppButton to="/catalogue" variant="outline" size="sm">Parcourir le catalogue</AppButton>
    </div>

    <template v-else>
      <!-- Groupe de boutons aria-pressed, comme les puces du catalogue : un
           filtre de la grille, pas des panneaux distincts (pas de tablist). -->
      <div class="tabs" role="group" aria-label="Statut">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="tab"
          :aria-pressed="statusFilter === tab.value"
          @click="statusFilter = tab.value"
        >
          {{ tab.label }}
          <span class="tab__count">{{ tabCounts[tab.value] ?? 0 }}</span>
        </button>
      </div>

      <section class="filters" aria-label="Recherche, filtres et tri">
        <div class="search">
          <label for="list-search" class="sr-only">Rechercher par titre ou auteur</label>
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
            id="list-search"
            v-model="search"
            class="search__field"
            type="search"
            placeholder="Titre ou auteur..."
          >
        </div>
        <AppSelect v-model="genreFilter" label="Genre" :options="genreFilterOptions" />
        <AppSelect v-model="minRatingFilter" label="Note minimale" :options="minRatingOptions" />
        <AppSelect v-model="sort" label="Trier par" :options="sortOptions" />
      </section>

      <div class="toolbar">
        <p class="toolbar__count" aria-live="polite">
          {{ filteredEntries.length }} {{ filteredEntries.length > 1 ? 'titres' : 'titre' }}
        </p>
        <AppButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="resetFilters">
          Réinitialiser
        </AppButton>
      </div>
      <p class="sr-only" aria-live="polite">{{ announcement }}</p>

      <div v-if="!tabCounts[statusFilter]" class="empty">
        <h2>{{ activeTab.empty }}</h2>
        <p>Aucun webtoon de ta liste n'a ce statut pour le moment.</p>
      </div>

      <div v-else-if="filteredEntries.length === 0" class="empty">
        <h2>Aucun résultat</h2>
        <p>Aucun titre ne correspond à ces critères. Essaie un autre terme ou un autre filtre.</p>
        <AppButton variant="outline" size="sm" @click="resetFilters">
          Réinitialiser les filtres
        </AppButton>
      </div>

      <div v-else class="wt-grid">
        <WebtoonCard
          v-for="entry in filteredEntries"
          :key="entry.id"
          :item="entry"
          open-mode="event"
          :busy="pendingIds.has(entry.id)"
          @open="openEdit(entry)"
          @increment="handleIncrement(entry)"
        />
      </div>
    </template>

    <AppModal v-model:open="editOpen" :persistent="saving">
      <template #title>Modifier ma lecture</template>
      <template v-if="editTarget">
        <p class="text-secondary modal-subtitle">{{ editTarget.webtoon.title }}</p>
        <ReadingEntryForm
          :key="editTarget.id"
          :entry="editTarget"
          :errors="editErrors"
          :global-error="editGlobalError"
          :submitting="saving"
          @submit="handleEditSubmit"
          @cancel="editOpen = false"
        />
        <div class="modal-extra">
          <NuxtLink :to="`/catalogue/${editTarget.webtoonId}`" class="modal-extra__link">
            Voir la fiche du webtoon
          </NuxtLink>
          <AppButton variant="ghost" size="sm" :aria-disabled="saving" @click="!saving && askRemove()">
            Retirer de ma liste
          </AppButton>
        </div>
      </template>
    </AppModal>

    <AppModal v-model:open="removeOpen" :persistent="removing">
      <template #title>Retirer ce webtoon de ta liste ?</template>
      <p>
        Ta progression, ta note et ton commentaire sur {{ editTarget?.webtoon.title }} seront
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
/* .tabs du UI kit : onglets soulignes. Compteur en 14px (V5, 12px dans le kit). */
.tabs {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-line);
}

.tab {
  margin-bottom: -1px;
  padding: var(--space-3) 18px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  font-family: var(--font-body);
  font-size: var(--fs-small);
  color: var(--color-text-soft);
  cursor: pointer;
  transition: color 120ms ease;
}

.tab:hover {
  color: var(--color-text);
}

.tab:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

/* Actif : souligne dore et texte encre en gras, pas la seule couleur. */
.tab[aria-pressed='true'] {
  border-bottom-color: var(--color-accent);
  color: var(--color-text);
  font-weight: 700;
}

.tab__count {
  margin-left: 6px;
  font-style: italic;
  font-weight: 400;
  color: var(--color-text-soft);
}

.filters {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) repeat(3, minmax(160px, 1fr));
  align-items: end;
  gap: var(--space-3) var(--space-4);
}

/* Champ de recherche en pilule, comme le catalogue. */
.search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

/* 16px : evite le zoom automatique de Safari iOS au focus. */
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

.modal-subtitle {
  margin: 0 0 var(--space-4);
}

.modal-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}

.modal-extra__link {
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-underline-offset: var(--space-1);
}

@media (max-width: 1023px) {
  .filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .search {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .tab {
    padding: var(--space-2) var(--space-3);
  }
}
</style>
