<script setup lang="ts">
import type { Genre, Webtoon, WebtoonFormPayload } from '~/types/webtoon'

const props = withDefaults(
  defineProps<{
    initialValue?: Webtoon
    genres: Genre[]
    submitLabel: string
    errors?: Record<string, string>
    submitting?: boolean
  }>(),
  {
    initialValue: undefined,
    errors: () => ({}),
    submitting: false,
  }
)

const emit = defineEmits<{
  submit: [payload: WebtoonFormPayload]
}>()

const title = ref(props.initialValue?.title ?? '')
const author = ref(props.initialValue?.author ?? '')
const description = ref(props.initialValue?.description ?? '')
const coverUrl = ref(props.initialValue?.coverUrl ?? '')
// string | number : AppInput type="number" renvoie un Number via v-model
// (voir AppInput.vue), meme si le champ demarre vide (string).
const chaptersTotal = ref<string | number>(
  props.initialValue?.chaptersTotal ? String(props.initialValue.chaptersTotal) : ''
)
const link = ref(props.initialValue?.link ?? '')
const selectedGenreIds = ref<string[]>(props.initialValue?.genres.map((genre) => genre.id) ?? [])

function isGenreSelected(genreId: string) {
  return selectedGenreIds.value.includes(genreId)
}

function toggleGenre(genreId: string) {
  const index = selectedGenreIds.value.indexOf(genreId)
  if (index === -1) {
    selectedGenreIds.value.push(genreId)
  } else {
    selectedGenreIds.value.splice(index, 1)
  }
}

function handleSubmit() {
  emit('submit', {
    title: title.value,
    author: author.value,
    description: description.value.trim() === '' ? undefined : description.value.trim(),
    coverUrl: coverUrl.value.trim() === '' ? undefined : coverUrl.value.trim(),
    chaptersTotal:
      String(chaptersTotal.value).trim() === '' ? undefined : Number(chaptersTotal.value),
    link: link.value.trim() === '' ? undefined : link.value.trim(),
    genreIds: selectedGenreIds.value,
  })
}
</script>

<template>
  <form class="webtoon-form" @submit.prevent="handleSubmit">
    <AppInput v-model="title" label="Titre" :error="errors.title" />
    <AppInput v-model="author" label="Auteur" :error="errors.author" />

    <div class="webtoon-form__field">
      <label for="webtoon-description" class="webtoon-form__label">Description</label>
      <textarea
        id="webtoon-description"
        v-model="description"
        rows="4"
        class="webtoon-form__textarea"
      />
      <p v-if="errors.description" class="webtoon-form__error">{{ errors.description }}</p>
    </div>

    <AppInput
      v-model="coverUrl"
      label="URL de la couverture"
      type="url"
      placeholder="https://..."
      :error="errors.coverUrl"
    />
    <AppInput
      v-model="chaptersTotal"
      label="Nombre de chapitres"
      type="number"
      :error="errors.chaptersTotal"
    />
    <AppInput
      v-model="link"
      label="Lien de lecture"
      type="url"
      placeholder="https://..."
      :error="errors.link"
    />

    <div class="webtoon-form__field">
      <span class="webtoon-form__label">Genres</span>
      <div class="webtoon-form__genres">
        <label v-for="genre in genres" :key="genre.id" class="webtoon-form__genre">
          <input
            type="checkbox"
            :checked="isGenreSelected(genre.id)"
            @change="toggleGenre(genre.id)"
          >
          {{ genre.name }}
        </label>
      </div>
      <p v-if="errors.genreIds" class="webtoon-form__error">{{ errors.genreIds }}</p>
    </div>

    <AppButton type="submit" :disabled="submitting">{{ submitLabel }}</AppButton>
  </form>
</template>

<style scoped>
.webtoon-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 480px;
  /* margin-inline: auto centre le formulaire dans .page (max-width: 720px),
     sinon il colle au bord gauche du conteneur. */
  margin: var(--spacing-lg) auto 0;
}

/* Duplique le style de AppInput (app-input / app-input__label /
   app-input__error) pour les deux champs qui n'utilisent pas ce composant
   (textarea, cases a cocher des genres). Les classes .app-input__* d'AppInput
   sont scopees a AppInput.vue : elles ne s'appliquent pas ici, d'ou une
   classe locale distincte plutot qu'un nom partage trompeur. */
.webtoon-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.webtoon-form__label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}

.webtoon-form__error {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.webtoon-form__textarea {
  font-family: var(--font-body);
  font-size: 16px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}

.webtoon-form__textarea:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.webtoon-form__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-md);
}

.webtoon-form__genre {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 14px;
}
</style>
