<script setup lang="ts">
import type { Genre, WebtoonFormPayload } from '~/types/webtoon'

const apiBase = useApiBase()
const router = useRouter()
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const { data: genres } = await useFetch<Genre[]>(`${apiBase}/genres`, { key: 'genres' })

async function handleSubmit(payload: WebtoonFormPayload) {
  errors.value = {}
  submitting.value = true
  try {
    const webtoon = await $fetch<{ id: string }>(`${apiBase}/webtoons`, {
      method: 'POST',
      body: payload,
    })
    await router.push(`/catalogue/${webtoon.id}`)
  } catch (error) {
    errors.value = extractValidationErrors(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="page">
    <NuxtLink to="/catalogue" class="back-link text-secondary">&larr; Retour au catalogue</NuxtLink>
    <AppPageHeader
      eyebrow="Catalogue"
      title="Ajouter un webtoon"
      subtitle="Le titre rejoint le catalogue commun ; tu pourras ensuite l'ajouter à ta liste."
    />
    <WebtoonForm
      :genres="genres ?? []"
      submit-label="Ajouter au catalogue"
      :errors="errors"
      :submitting="submitting"
      @submit="handleSubmit"
    />
  </main>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: var(--space-4);
}
</style>
