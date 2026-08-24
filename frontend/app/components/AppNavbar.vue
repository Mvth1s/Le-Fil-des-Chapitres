<script setup lang="ts">
// Routes anticipees (CAHIER_DES_CHARGES.md section 10) : les pages
// n'existent pas encore avant l'etape 6, les liens sont deja corrects pour
// eviter de retoucher ce composant plus tard.
const links = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/liste', label: 'Ma liste' },
  { to: '/statistiques', label: 'Statistiques' },
]
</script>

<template>
  <nav class="app-navbar">
    <NuxtLink to="/" class="app-navbar__logo">
      <img src="/logo-icon.png" alt="" class="app-navbar__logo-icon">
      Le Fil des Chapitres
    </NuxtLink>
    <ul class="app-navbar__links">
      <li v-for="link in links" :key="link.to">
        <NuxtLink :to="link.to" class="app-navbar__link">{{ link.label }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-navbar__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 28px;
  color: var(--color-text);
  text-decoration: none;
}

.app-navbar__logo-icon {
  height: 32px;
  width: auto;
}

.app-navbar__links {
  display: flex;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-navbar__link {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text);
  text-decoration: none;
}

.app-navbar__link:hover,
.app-navbar__link.router-link-active {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
