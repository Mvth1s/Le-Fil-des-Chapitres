<template>
  <div class="app-card">
    <header v-if="$slots.header" class="app-card__header">
      <slot name="header" />
    </header>
    <div class="app-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.app-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(61, 59, 47, 0.06);
}

.app-card__header {
  margin-bottom: var(--spacing-md);
}

.app-card__footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}
</style>
