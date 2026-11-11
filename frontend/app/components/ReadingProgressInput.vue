<script setup lang="ts">
// Saisie directe du chapitre actuel sur une carte de la liste (US-06).
// Valide cote client puis emet la nouvelle valeur absolue ; l'appel API
// (et son retour arriere en cas d'echec) reste dans la page.
const props = withDefaults(
  defineProps<{
    chaptersRead: number
    chaptersTotal: number | null
    disabled?: boolean
  }>(),
  { disabled: false }
)

const emit = defineEmits<{ submit: [chaptersRead: number] }>()

const draft = ref<string | number>(props.chaptersRead)
const error = ref('')

// Resynchronise le champ quand la progression change ailleurs (+1, edition,
// retour arriere apres une erreur).
watch(
  () => props.chaptersRead,
  (value) => {
    draft.value = value
    error.value = ''
  }
)

function handleSubmit() {
  if (props.disabled) return
  error.value = validateChaptersRead(draft.value, props.chaptersTotal)
  if (error.value || Number(draft.value) === props.chaptersRead) return
  emit('submit', Number(draft.value))
}
</script>

<template>
  <form class="reading-progress-input" novalidate @submit.prevent="handleSubmit">
    <AppInput
      v-model="draft"
      label="Chapitre actuel"
      type="number"
      :min="0"
      :max="chaptersTotal ?? undefined"
      :step="1"
      :error="error"
    />
    <AppButton type="submit" variant="outline" size="sm" :aria-disabled="disabled">
      Valider
    </AppButton>
  </form>
</template>

<style scoped>
.reading-progress-input {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.reading-progress-input > :first-child {
  flex: 1;
  min-width: 0;
}

/* Aligne le bouton sur le champ (sous le label de 14px). */
.reading-progress-input > :last-child {
  margin-top: calc(14px * 1.5 + var(--spacing-xs));
}
</style>
