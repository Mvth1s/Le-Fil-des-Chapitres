<script setup lang="ts">
import type { Genre, Webtoon, WebtoonFormPayload } from '~/types/webtoon'

const route = useRoute()
const router = useRouter()
const apiBase = useApiBase()
// route.params.id est une route dynamique unique : toujours une string,
// meme si le typage de vue-router reste generique (voir catalogue/[id]/index.vue).
const webtoonId = String(route.params.id)

const {
  data: webtoon,
  error: fetchError,
} = await useFetch<Webtoon>(`${apiBase}/webtoons/${webtoonId}`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : necessaire
  // car apiBase differe entre le SSR et le navigateur.
  key: `webtoon-${webtoonId}`,
})
const { data: genres } = await useFetch<Genre[]>(`${apiBase}/genres`, { key: 'genres' })

const errors = ref<Record<string, string>>({})
const submitting = ref(false)

async function handleSubmit(payload: WebtoonFormPayload) {
  errors.value = {}
  submitting.value = true
  try {
    await $fetch(`${apiBase}/webtoons/${webtoonId}`, {
      method: 'PUT',
      body: payload,
    })
    await router.push(`/catalogue/${webtoonId}`)
  } catch (error) {
    errors.value = extractValidationErrors(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="page">
    <NuxtLink :to="`/catalogue/${webtoonId}`" class="text-secondary">&larr; Retour a la fiche</NuxtLink>

    <div v-if="fetchError" class="error-box">
      <p v-if="fetchError.statusCode === 404">Ce webtoon n'existe pas.</p>
      <p v-else>Impossible de charger ce webtoon pour le moment.</p>
    </div>

    <template v-else-if="webtoon">
      <h1>Modifier {{ webtoon.title }}</h1>
      <WebtoonForm
        :initial-value="webtoon"
        :genres="genres ?? []"
        submit-label="Enregistrer les modifications"
        :errors="errors"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </template>
  </main>
</template>

<style scoped>
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 720px;
  margin: 0 auto;
}

.error-box {
  margin-top: var(--spacing-md);
}
</style>
