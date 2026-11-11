<script setup lang="ts">
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'

const apiBase = useApiBase()
const router = useRouter()
const toast = useToast()
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
  } catch {
    toast.error('Le changement de statut a echoue. Reessaie dans un instant.')
  } finally {
    updatingId.value = null
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
  if (updatingId.value === entry.id) return
  updatingId.value = entry.id
  const previous = entry.chaptersRead
  patchEntry(entry.id, { chaptersRead })
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${entry.id}/progress`, {
      method: 'PATCH',
      body: { chaptersRead },
    })
    patchEntry(entry.id, updated)
  } catch (error) {
    patchEntry(entry.id, { chaptersRead: previous })
    toast.error(
      extractBusinessError(error) ??
        Object.values(extractValidationErrors(error))[0] ??
        'La mise à jour de la progression a échoué. Réessaie dans un instant.'
    )
  } finally {
    updatingId.value = null
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
  if (!editTarget.value || saving.value) return
  saving.value = true
  editErrors.value = {}
  editGlobalError.value = ''
  try {
    const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${editTarget.value.id}`, {
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
          @keydown.enter.self="goToDetail(entry.webtoonId)"
        >
          <template #header>
            <h3>{{ entry.webtoon.title }}</h3>
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
              :aria-disabled="updatingId === entry.id"
              @click.stop="updateProgress(entry, entry.chaptersRead + 1)"
            >
              +1 chapitre
            </AppButton>
          </div>

          <ReadingProgressInput
            :chapters-read="entry.chaptersRead"
            :chapters-total="entry.webtoon.chaptersTotal"
            :disabled="updatingId === entry.id"
            @click.stop
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

          <div class="actions">
            <AppButton
              variant="outline"
              size="sm"
              :aria-label="`Modifier ma lecture de ${entry.webtoon.title}`"
              @click.stop="openEdit(entry)"
            >
              Modifier
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              :aria-label="`Retirer ${entry.webtoon.title} de ma liste`"
              @click.stop="openRemove(entry)"
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

/* Le select de statut et le bouton +1 chapitre restent des commandes
   independantes de la navigation de la carte (voir @click.stop dans le
   template) : curseur normal, pas de confusion avec le clic-pour-naviguer
   du reste de la carte. */
.entry-card :deep(.app-select),
.entry-card :deep(.app-input),
.entry-card :deep(.app-button) {
  cursor: auto;
}

/* Annule le curseur "interdit" par defaut de AppButton:disabled : le
   bouton est desactive tres brievement pendant la requete (voir
   updatingId), l'opacite reduite suffit comme indicateur, la croix rouge
   du curseur clignotant le temps de l'appel est plus perturbante qu'utile. */
.entry-card :deep(.app-button:disabled) {
  cursor: auto;
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
