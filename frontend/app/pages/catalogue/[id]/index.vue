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
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : necessaire
  // car apiBase differe entre le SSR et le navigateur.
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
          <AppButton variant="ghost" size="sm" :disabled="deleting" @click="confirmOpen = true">
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

      <section class="my-list" aria-labelledby="my-list-title">
        <h2 id="my-list-title">Ma liste</h2>
        <p v-if="listPending && !listEntries" class="text-secondary" role="status">
          Chargement...
        </p>
        <div v-else-if="listError" class="error-box" role="alert">
          <p>Impossible de vérifier ta liste de lecture pour le moment.</p>
          <AppButton variant="outline" size="sm" @click="refreshList()">Réessayer</AppButton>
        </div>
        <div v-else-if="listEntry" class="my-list__row">
          <AppBadge :variant="listEntry.status">{{ STATUS_LABELS[listEntry.status] }}</AppBadge>
          <NuxtLink ref="listLink" to="/liste">Voir ma liste</NuxtLink>
        </div>
        <form v-else class="my-list__row" @submit.prevent="handleAddToList">
          <AppSelect v-model="newStatus" label="Statut de lecture" :options="statusOptions" />
          <AppButton type="submit" :aria-disabled="adding">
            {{ adding ? 'Ajout...' : 'Ajouter à ma liste' }}
          </AppButton>
        </form>
      </section>
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

.my-list {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.my-list__row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
</style>
