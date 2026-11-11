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
    <NuxtLink to="/catalogue" class="text-secondary">&larr; Retour au catalogue</NuxtLink>
    <h1>Ajouter un webtoon</h1>
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
.page {
  padding: var(--spacing-xl) var(--spacing-lg);
  max-width: 720px;
  margin: 0 auto;
}
</style>
