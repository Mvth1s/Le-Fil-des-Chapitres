<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'
import { USER_WEBTOON_STATUSES, type UserWebtoon, type UserWebtoonStatus } from '~/types/user-webtoon'

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
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : partagee
  // entre le SSR et l'hydratation.
  key: `webtoon-${webtoonId}`,
})

const deleting = ref(false)
const confirmOpen = ref(false)
const toast = useToast()

async function handleDelete() {
  // Garde contre le double clic : le bouton utilise aria-disabled (et non
  // disabled) pour conserver le focus pendant la requete.
  if (deleting.value) return
  deleting.value = true
  try {
    await $fetch(`${apiBase}/webtoons/${webtoonId}`, { method: 'DELETE' })
    confirmOpen.value = false
    toast.success('Webtoon supprime du catalogue.')
    await router.push('/catalogue')
  } catch {
    toast.error('La suppression a echoue. Reessaie dans un instant.')
  } finally {
    deleting.value = false
  }
}

// Section "Ma liste" (US-05). Meme cle que pages/liste/index.vue : le cache
// partage reste a jour quand on navigue ensuite vers /liste.
const {
  data: listEntries,
  pending: listPending,
  error: listError,
  refresh: refreshList,
} = await useFetch<UserWebtoon[]>(`${apiBase}/user/list`, { key: 'user-list' })

const listEntry = computed(() =>
  listEntries.value?.find((entry) => entry.webtoonId === webtoonId)
)

const statusOptions = USER_WEBTOON_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))
const newStatus = ref<UserWebtoonStatus>('plan_to_read')
const adding = ref(false)
const listLink = ref<{ $el: HTMLElement } | null>(null)

// Apres l'ajout, le formulaire disparait : on deplace le focus sur le lien
// qui le remplace pour ne pas le perdre (clavier, lecteur d'ecran).
async function refreshAndFocusLink() {
  await refreshList()
  await nextTick()
  listLink.value?.$el.focus()
}

// Progression et "+1 chapitre" (meme logique que WebtoonCard).
const { increment, pendingIds } = useChapterIncrement(listEntries)
const progress = computed(() => {
  const total = webtoon.value?.chaptersTotal
  return listEntry.value && total
    ? Math.min(100, Math.round((listEntry.value.chaptersRead / total) * 100))
    : null
})
const canIncrement = computed(() => {
  const total = webtoon.value?.chaptersTotal ?? null
  return (
    listEntry.value?.status === 'reading' &&
    (total === null || listEntry.value.chaptersRead < total)
  )
})

async function handleIncrement() {
  if (!listEntry.value) return
  const updated = await increment(listEntry.value)
  // Lecture terminee : le bouton +1 disparait, le focus passe sur le lien.
  if (updated && updated.status !== 'reading') {
    await nextTick()
    listLink.value?.$el.focus()
  }
}

async function handleAddToList() {
  if (adding.value) return
  adding.value = true
  try {
    await $fetch(`${apiBase}/user/list`, {
      method: 'POST',
      body: { webtoonId, status: newStatus.value },
    })
    toast.success('Webtoon ajouté à ta liste de lecture.')
    await refreshAndFocusLink()
  } catch (error) {
    if (isAlreadyInListError(error)) {
      toast.error('Ce webtoon est déjà dans ta liste de lecture.')
      await refreshAndFocusLink()
    } else {
      const firstMessage = Object.values(extractValidationErrors(error))[0]
      toast.error(firstMessage ?? "L'ajout à ta liste a échoué. Réessaie dans un instant.")
    }
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <main class="page">
    <NuxtLink to="/catalogue" class="back-link text-secondary">&larr; Retour au catalogue</NuxtLink>

    <p v-if="pending" class="text-secondary">Chargement...</p>

    <div v-else-if="error" class="error-box" role="alert">
      <p v-if="error.statusCode === 404">Ce webtoon n'existe pas.</p>
      <template v-else>
        <p>Impossible de charger cette fiche pour le moment.</p>
        <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
      </template>
    </div>

    <article v-else-if="webtoon" class="detail">
      <AppCover
        :src="webtoon.coverUrl"
        :title="webtoon.title"
        :webtoon-id="webtoon.id"
        class="detail__cover"
      />

      <div class="detail__main">
        <AppPageHeader eyebrow="Fiche du catalogue" :title="webtoon.title" :subtitle="webtoon.author">
          <template #actions>
            <AppButton :to="`/catalogue/${webtoonId}/edit`" variant="outline" size="sm">
              Modifier
            </AppButton>
            <AppButton variant="ghost" size="sm" :disabled="deleting" @click="confirmOpen = true">
              Supprimer
            </AppButton>
          </template>
        </AppPageHeader>

        <div v-if="webtoon.genres.length > 0" class="detail__genres">
          <AppGenreTag v-for="genre in webtoon.genres" :key="genre.id" :name="genre.name" />
        </div>

        <div v-if="webtoon.chaptersTotal || webtoon.link" class="detail__meta">
          <p v-if="webtoon.chaptersTotal" class="text-secondary">
            {{ webtoon.chaptersTotal }} chapitres au total
          </p>
          <AppButton v-if="webtoon.link" :href="webtoon.link" variant="outline" size="sm">
            Lire ce webtoon
          </AppButton>
        </div>

        <p v-if="webtoon.description" class="detail__description">{{ webtoon.description }}</p>

        <section class="my-list" aria-labelledby="my-list-title">
          <h2 id="my-list-title" class="my-list__title">Ma liste</h2>
          <p v-if="listPending && !listEntries" class="text-secondary" role="status">
            Chargement...
          </p>
          <div v-else-if="listError" class="error-box" role="alert">
            <p>Impossible de vérifier ta liste de lecture pour le moment.</p>
            <AppButton variant="outline" size="sm" @click="refreshList()">Réessayer</AppButton>
          </div>
          <div v-else-if="listEntry" class="my-list__entry">
            <!-- Live : statut et chapitres annonces apres un +1. -->
            <div class="my-list__summary" aria-live="polite">
              <AppStatusChip :status="listEntry.status" />
              <span class="my-list__chapters">
                Ch. {{ listEntry.chaptersRead
                }}<template v-if="webtoon.chaptersTotal"> / {{ webtoon.chaptersTotal }}</template>
              </span>
            </div>
            <div v-if="progress !== null" class="my-list__progress" aria-hidden="true">
              <div class="my-list__progress-bar" :style="{ width: `${progress}%` }" />
            </div>
            <p class="my-list__rating">
              <template v-if="listEntry.rating !== null">
                Ma note : <strong>{{ listEntry.rating }} / 10</strong>
              </template>
              <template v-else>Pas encore de note.</template>
            </p>
            <div class="my-list__actions">
              <button
                v-if="canIncrement"
                type="button"
                class="my-list__plus"
                :aria-disabled="pendingIds.has(listEntry.id)"
                @click="!pendingIds.has(listEntry.id) && handleIncrement()"
              >
                +1 chapitre
              </button>
              <NuxtLink ref="listLink" to="/liste">Voir et modifier dans ma liste</NuxtLink>
            </div>
          </div>
          <form v-else class="my-list__form" @submit.prevent="handleAddToList">
            <AppSelect v-model="newStatus" label="Statut de lecture" :options="statusOptions" />
            <AppButton type="submit" :aria-disabled="adding">
              {{ adding ? 'Ajout...' : 'Ajouter à ma liste' }}
            </AppButton>
          </form>
        </section>
      </div>
    </article>

    <AppModal v-model:open="confirmOpen" :persistent="deleting">
      <template #title>Supprimer ce webtoon ?</template>
      <p>
        {{ webtoon?.title }} sera retire definitivement du catalogue, ainsi que des listes de
        lecture qui le contiennent.
      </p>
      <template #actions>
        <AppButton
          variant="outline"
          size="sm"
          :aria-disabled="deleting"
          @click="!deleting && (confirmOpen = false)"
        >
          Annuler
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          :aria-disabled="deleting"
          @click="handleDelete"
        >
          {{ deleting ? 'Suppression...' : 'Supprimer' }}
        </AppButton>
      </template>
    </AppModal>
  </main>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: var(--space-5);
}

/* Couverture a gauche, infos a droite ; une colonne sous 768px. */
.detail {
  display: grid;
  grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
  align-items: start;
  gap: var(--space-7);
}

.detail__cover {
  box-shadow: var(--shadow-card);
}

.detail__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
}

/* AppPageHeader porte deja une marge basse : le gap du parent suffit. */
.detail__main > :first-child {
  margin-bottom: 0;
}

.detail__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
}

.detail__meta p {
  margin: 0;
}

/* Largeur de lecture confortable. */
.detail__description {
  max-width: 65ch;
  margin: 0;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.my-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 560px;
  padding: var(--space-5);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.my-list__title {
  margin: 0;
  font-size: var(--fs-h3);
}

.my-list__entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.my-list__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
}

/* --color-text-soft sur blanc : 6.9:1. */
.my-list__chapters,
.my-list__rating {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.my-list__rating strong {
  color: var(--color-text);
}

.my-list__progress {
  height: 6px;
  border-radius: 6px;
  background-color: var(--color-bg-sunken);
  overflow: hidden;
}

.my-list__progress-bar {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 240ms ease;
}

.my-list__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
}

/* Bouton +1 de WebtoonCard : --color-on-accent sur --color-accent, 5.03:1. */
.my-list__plus {
  padding: 6px 14px;
  border: 0;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: var(--fs-small);
  color: var(--color-on-accent);
  background-color: var(--color-accent);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.my-list__plus:hover {
  background-color: var(--color-accent-tint);
}

.my-list__plus[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}

.my-list__form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.error-box p {
  margin: 0;
}

@media (max-width: 767px) {
  .detail {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }

  .detail__cover {
    width: min(240px, 100%);
  }
}
</style>
