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

// Apercu de la couverture : URL debouncee (300 ms), envoyee a AppCover
// seulement si c'est une URL https valide. La CSP (img-src) bloque le http :
// on n'essaie pas de le charger, AppCover affiche la couverture generee et un
// avertissement non bloquant s'affiche (le backend accepte quand meme http).
const debouncedCoverUrl = useDebouncedRef(coverUrl, 300)
const previewSrc = computed(() => {
  const value = debouncedCoverUrl.value.trim()
  try {
    return new URL(value).protocol === 'https:' ? value : null
  } catch {
    return null
  }
})
const isHttpCover = computed(() => /^http:\/\//i.test(debouncedCoverUrl.value.trim()))

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
  <div class="webtoon-form">
    <form class="webtoon-form__fields" @submit.prevent="handleSubmit">
      <AppInput v-model="title" label="Titre" :error="errors.title" />
      <AppInput v-model="author" label="Auteur" :error="errors.author" />

      <div class="webtoon-form__field">
        <label for="webtoon-description" class="webtoon-form__label">Description</label>
        <textarea
          id="webtoon-description"
          v-model="description"
          rows="5"
          class="webtoon-form__textarea"
          :aria-invalid="!!errors.description"
          :aria-describedby="errors.description ? 'webtoon-description-error' : undefined"
        />
        <p v-if="errors.description" id="webtoon-description-error" class="webtoon-form__error">
          {{ errors.description }}
        </p>
      </div>

      <AppInput
        v-model="coverUrl"
        label="URL de la couverture"
        type="url"
        placeholder="https://..."
        hint="Adresse https d'une image (jpg, png, webp). Laisse vide pour une couverture générée."
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

      <fieldset
        class="webtoon-form__field webtoon-form__fieldset"
        :aria-describedby="errors.genreIds ? 'webtoon-genres-error' : undefined"
      >
        <legend class="webtoon-form__label">Genres</legend>
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
        <p v-if="errors.genreIds" id="webtoon-genres-error" class="webtoon-form__error">{{ errors.genreIds }}</p>
      </fieldset>

      <div>
        <AppButton type="submit" :disabled="submitting">{{ submitLabel }}</AppButton>
      </div>
    </form>

    <aside class="webtoon-form__preview" aria-labelledby="webtoon-preview-title">
      <h2 id="webtoon-preview-title" class="webtoon-form__preview-title">Aperçu</h2>
      <AppCover
        :src="previewSrc"
        :title="title"
        :webtoon-id="initialValue?.id ?? 'new-webtoon'"
      />
      <p class="webtoon-form__preview-name">{{ title.trim() || 'Sans titre' }}</p>
      <p v-if="author.trim()" class="webtoon-form__preview-author">{{ author }}</p>
      <!-- Region live toujours presente : l'avertissement est annonce a son apparition. -->
      <div role="status">
        <p v-if="isHttpCover" class="webtoon-form__warning">
          Les images http ne s'afficheront pas, utilise https.
        </p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Formulaire + apercu cote a cote, empiles sous 768px. */
.webtoon-form {
  display: grid;
  grid-template-columns: minmax(0, 680px) minmax(200px, 280px);
  align-items: start;
  gap: var(--space-7);
}

.webtoon-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

/* Duplique le style de AppInput (app-input / app-input__label /
   app-input__error) pour les champs qui n'utilisent pas ce composant
   (textarea, genres). Les classes .app-input__* d'AppInput sont scopees a
   AppInput.vue : elles ne s'appliquent pas ici, d'ou une classe locale. */
.webtoon-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.webtoon-form__fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

.webtoon-form__label {
  padding: 0;
  margin-bottom: var(--spacing-xs);
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
  line-height: var(--lh-body);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}

.webtoon-form__textarea:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.webtoon-form__textarea[aria-invalid='true'] {
  border-color: var(--color-rose);
}

.webtoon-form__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Puce de genre (.chip du catalogue) contenant une vraie case a cocher :
   etat coche = fond dore + gras + case cochee (pas la couleur seule). */
.webtoon-form__genre {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding: 4px 14px 4px 10px;
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface);
  font-size: var(--fs-small);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color 120ms ease,
    background-color 120ms ease;
}

.webtoon-form__genre:hover {
  border-color: var(--color-accent-shade);
}

.webtoon-form__genre:has(input:checked) {
  background-color: var(--color-accent);
  border-color: var(--color-accent-shade);
  color: var(--color-on-accent);
  font-weight: 700;
}

.webtoon-form__genre input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--color-focus);
}

.webtoon-form__preview {
  position: sticky;
  top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.webtoon-form__preview-title {
  margin: 0 0 var(--space-1);
  font-size: var(--fs-small);
  font-style: italic;
  font-weight: 400;
  letter-spacing: var(--letter-tag);
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.webtoon-form__preview .app-cover {
  box-shadow: var(--shadow-card);
}

.webtoon-form__preview-name {
  margin: var(--space-2) 0 0;
  font-weight: 600;
  font-size: 17px;
  line-height: var(--lh-snug);
  overflow-wrap: anywhere;
}

.webtoon-form__preview-author {
  margin: 0;
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text-soft);
  overflow-wrap: anywhere;
}

.webtoon-form__warning {
  margin: var(--space-2) 0 0;
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-sm);
  background-color: var(--color-accent-tint);
  font-size: var(--fs-small);
  color: var(--color-text);
}

@media (max-width: 767px) {
  .webtoon-form {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }

  .webtoon-form__preview {
    position: static;
    width: min(220px, 100%);
  }

  .webtoon-form__fields {
    padding: var(--space-5) var(--space-4);
  }
}
</style>
