<script setup lang="ts">
import { USER_WEBTOON_STATUSES, type UserWebtoon } from '~/types/user-webtoon'

// Formulaire d'edition d'une entree de la liste de lecture (US-07), affiche
// dans une AppModal par pages/liste/index.vue. Il valide cote client avant
// d'emettre `submit` ; les erreurs serveur (422) sont fournies par le parent.
const props = withDefaults(
  defineProps<{
    entry: UserWebtoon
    errors?: Record<string, string>
    globalError?: string
    submitting?: boolean
  }>(),
  {
    errors: () => ({}),
    globalError: '',
    submitting: false,
  }
)

const emit = defineEmits<{
  submit: [payload: ReadingEntryPayload]
  cancel: []
}>()

const statusOptions = USER_WEBTOON_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

const values = reactive<ReadingEntryFormValues>({
  status: props.entry.status,
  chaptersRead: props.entry.chaptersRead,
  rating: props.entry.rating ?? '',
  comment: props.entry.comment ?? '',
  startedAt: toDateInputValue(props.entry.startedAt),
  finishedAt: toDateInputValue(props.entry.finishedAt),
})

const clientErrors = ref<Record<string, string>>({})
const shownErrors = computed(() => ({ ...props.errors, ...clientErrors.value }))

const commentId = useId()
const chaptersTotal = props.entry.webtoon.chaptersTotal

function handleSubmit() {
  // Garde contre le double envoi : les boutons utilisent aria-disabled
  // (et non disabled) pour garder le focus pendant la requete.
  if (props.submitting) return
  clientErrors.value = validateReadingEntry(values, chaptersTotal)
  if (Object.keys(clientErrors.value).length > 0) return
  emit('submit', toReadingEntryPayload(values))
}
</script>

<template>
  <form class="reading-entry-form" novalidate @submit.prevent="handleSubmit">
    <p v-if="globalError" class="reading-entry-form__global-error" role="alert">
      {{ globalError }}
    </p>

    <AppSelect v-model="values.status" label="Statut" :options="statusOptions" />

    <AppInput
      v-model="values.chaptersRead"
      :label="chaptersTotal === null ? 'Chapitres lus' : `Chapitres lus (sur ${chaptersTotal})`"
      type="number"
      :min="0"
      :max="chaptersTotal ?? undefined"
      :step="1"
      :error="shownErrors.chaptersRead"
    />

    <AppInput
      v-model="values.rating"
      label="Note (0 à 10, facultative)"
      type="number"
      :min="0"
      :max="10"
      :step="0.5"
      :error="shownErrors.rating"
    />

    <div class="reading-entry-form__field">
      <label :for="commentId" class="reading-entry-form__label">Commentaire (facultatif)</label>
      <textarea
        :id="commentId"
        v-model="values.comment"
        rows="4"
        class="reading-entry-form__textarea"
        :aria-invalid="!!shownErrors.comment"
        :aria-describedby="shownErrors.comment ? `${commentId}-error` : undefined"
      />
      <p v-if="shownErrors.comment" :id="`${commentId}-error`" class="reading-entry-form__error">
        {{ shownErrors.comment }}
      </p>
    </div>

    <div class="reading-entry-form__dates">
      <AppInput
        v-model="values.startedAt"
        label="Date de début"
        type="date"
        :error="shownErrors.startedAt"
      />
      <AppInput
        v-model="values.finishedAt"
        label="Date de fin"
        type="date"
        :error="shownErrors.finishedAt"
      />
    </div>

    <div class="reading-entry-form__actions">
      <AppButton
        variant="outline"
        size="sm"
        :aria-disabled="submitting"
        @click="!submitting && emit('cancel')"
      >
        Annuler
      </AppButton>
      <AppButton type="submit" variant="secondary" size="sm" :aria-disabled="submitting">
        {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
      </AppButton>
    </div>
  </form>
</template>

<style scoped>
.reading-entry-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Meme style que les champs d'AppInput (voir WebtoonForm.vue pour la
   meme duplication sur la textarea, les classes d'AppInput etant scopees). */
.reading-entry-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.reading-entry-form__label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}

.reading-entry-form__textarea {
  font-family: var(--font-body);
  font-size: 16px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}

.reading-entry-form__textarea:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.reading-entry-form__textarea[aria-invalid='true'] {
  border-color: var(--color-rose);
}

.reading-entry-form__error,
.reading-entry-form__global-error {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

/* Erreur globale : bordure rose (decorative) et texte fonce, comme les
   erreurs de champ (--color-rose manque de contraste pour du texte). */
.reading-entry-form__global-error {
  padding: var(--spacing-sm) var(--spacing-md);
  border-left: 4px solid var(--color-rose);
  background-color: var(--color-surface);
}

.reading-entry-form__dates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.reading-entry-form__dates > * {
  flex: 1;
  min-width: 160px;
}

.reading-entry-form__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
</style>
