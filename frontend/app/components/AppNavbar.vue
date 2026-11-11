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
  /* A 375px les quatre liens ne tiennent pas sur une ligne : ils passent a
     la ligne entre eux plutot qu'au milieu d'un libelle ("Ma liste"). */
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.app-navbar__link {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

/* Texte en --color-text : --color-primary n'a que 3.0:1 sur --color-surface,
   insuffisant a 16px. Le vert reste dans le soulignement. */
.app-navbar__link:hover,
.app-navbar__link.router-link-active {
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
</style>
