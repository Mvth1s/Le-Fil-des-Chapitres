<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    error?: string
    disabled?: boolean
  }>(),
  {
    label: '',
    type: 'text',
    placeholder: '',
    error: '',
    disabled: false,
  }
)

// string | number : pour un <input type="number">, Vue caste automatiquement
// la valeur du v-model en Number des que le prop "type" resolu vaut "number"
// (comportement du runtime, independant du modificateur .number), meme si
// "type" est ici une simple prop string. Le consommateur doit donc gerer
// les deux cas s'il utilise type="number".
const model = defineModel<string | number>()

// id stable pour lier <label for> et <input id> sans que l'appelant ait a
// le fournir lui-meme.
const inputId = useId()
</script>

<template>
  <div class="app-input">
    <label v-if="label" :for="inputId" class="app-input__label">{{ label }}</label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="app-input__field"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : undefined"
    >
    <p v-if="error" :id="`${inputId}-error`" class="app-input__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.app-input__label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}

.app-input__field {
  font-family: var(--font-body);
  font-size: 16px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
}

.app-input__field:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.app-input__field[aria-invalid='true'] {
  border-color: var(--color-rose);
}

.app-input__error {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  /* --color-rose n'a pas assez de contraste pour du texte (voir resume de
     l'etape 5) : on garde --color-text et on compte sur le gras + la
     bordure rose du champ pour signaler l'erreur visuellement. */
  color: var(--color-text);
}
</style>
