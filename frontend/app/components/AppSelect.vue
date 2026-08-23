<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    options: Array<{ label: string; value: string }>
    disabled?: boolean
  }>(),
  {
    label: '',
    disabled: false,
  }
)

const model = defineModel<string>()
const selectId = useId()
</script>

<template>
  <div class="app-select">
    <label v-if="label" :for="selectId" class="app-select__label">{{ label }}</label>
    <select :id="selectId" v-model="model" :disabled="disabled" class="app-select__field">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.app-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.app-select__label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
}

.app-select__field {
  font-family: var(--font-body);
  font-size: 16px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
}

.app-select__field:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}
</style>
