<script setup lang="ts">
// Header du UI kit (Maquette/ui-kit/nav.jsx). Pas d'avatar (decision V3).
const links = [
  { to: '/', label: 'Accueil' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/liste', label: 'Ma liste' },
  { to: '/statistiques', label: 'Statistiques' },
]

const route = useRoute()

// Les sous-routes activent leur section (/catalogue/:id => Catalogue). Les
// pages ne sont pas imbriquees cote routeur, la classe router-link-active ne
// suffit donc pas. "page" sur la page exacte, "true" sur une sous-page
// (element courant d'un ensemble, au sens ARIA).
function ariaCurrent(to: string): 'page' | 'true' | undefined {
  if (route.path === to) return 'page'
  if (to !== '/' && route.path.startsWith(`${to}/`)) return 'true'
  return undefined
}

// Recherche globale (decision V8) : la page catalogue lit ?q= et applique
// sa propre recherche.
const query = ref('')
const searchId = useId()
function submitSearch() {
  const q = query.value.trim()
  void navigateTo({ path: '/catalogue', query: q ? { q } : {} })
}

// Menu mobile (< 640px). Le panneau suit le bouton dans le DOM : Tab y entre
// naturellement, sans deplacer le focus de force ni le pieger.
const menuOpen = ref(false)
const toggleRef = ref<HTMLButtonElement | null>(null)
const panelId = useId()

function closeMenu(returnFocus = false) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (returnFocus) toggleRef.value?.focus()
}

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  }
)
</script>

<template>
  <header class="nav" @keydown.esc="closeMenu(true)">
    <NuxtLink to="/" class="nav__brand">
      <img src="/logo-icon.png" alt="" class="nav__logo" width="43" height="38">
      Le Fil des Chapitres
    </NuxtLink>

    <button
      ref="toggleRef"
      type="button"
      class="nav__toggle"
      :aria-expanded="menuOpen"
      :aria-controls="panelId"
      :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
      @click="menuOpen = !menuOpen"
    >
      <svg
width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
        <path v-if="menuOpen" d="M6 6l12 12M18 6 6 18" />
        <path v-else d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>

    <div :id="panelId" class="nav__panel" :class="{ 'is-open': menuOpen }">
      <nav class="nav__links-wrapper" aria-label="Navigation principale">
        <ul class="nav__links">
          <li v-for="link in links" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="nav__link"
              :aria-current="ariaCurrent(link.to)"
              @click="closeMenu()"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <form role="search" action="/catalogue" class="nav__search" @submit.prevent="submitSearch">
        <label :for="searchId" class="sr-only">Rechercher un titre dans le catalogue</label>
        <svg
width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          :id="searchId"
          v-model="query"
          type="search"
          name="q"
          placeholder="Rechercher un titre..."
          autocomplete="off"
        >
      </form>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 28px;
  min-height: 68px;
  padding: 0 28px;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 26px;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.nav__logo {
  height: 38px;
  width: auto;
}

.nav__toggle {
  display: none;
}

.nav__panel {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 28px;
}

.nav__links-wrapper {
  flex: 1;
}

.nav__links {
  display: flex;
  justify-content: center;
  gap: 26px;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Texte en encre : le dore du UI kit (--color-accent-shade) n'atteint pas
   4.5:1 sur le fond creme. Le dore reste dans le soulignement. */
.nav__link {
  position: relative;
  display: block;
  padding: 22px 4px;
  font-family: var(--font-body);
  font-size: 14px;
  letter-spacing: 0.01em;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.nav__link:hover,
.nav__link[aria-current] {
  color: var(--color-text);
}

.nav__link[aria-current]::after,
.nav__link:hover::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  height: 1.5px;
  background-color: var(--color-accent);
}

.nav__link:hover:not([aria-current])::after {
  background-color: var(--color-line);
}

.nav__search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  padding: 6px 14px;
  color: var(--color-text-muted);
  background-color: var(--color-surface);
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-pill);
}

/* Contour porte par la pilule entiere ; un champ texte affiche de toute
   facon son focus a la souris comme au clavier. */
.nav__search:focus-within {
  border-color: var(--color-focus);
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.nav__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text);
}

.nav__search input:focus-visible {
  outline: none;
}

/* Tablette : liens sur une seconde ligne, la premiere ne tient pas. */
@media (min-width: 640px) and (max-width: 1023px) {
  .nav__panel {
    display: contents;
  }

  .nav__links-wrapper {
    order: 3;
    flex-basis: 100%;
  }

  .nav__search {
    margin-left: auto;
  }

  .nav__link {
    padding: 10px 4px 14px;
  }

  .nav__link[aria-current]::after,
  .nav__link:hover::after {
    bottom: 8px;
  }
}

/* Mobile : bouton menu et panneau deroulant, sans animation. */
@media (max-width: 639px) {
  .nav {
    justify-content: space-between;
    padding: 0 var(--space-4);
  }

  .nav__brand {
    font-size: 22px;
  }

  .nav__toggle {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    color: var(--color-text);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .nav__panel {
    display: none;
  }

  .nav__panel.is-open {
    display: flex;
    flex-basis: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    padding: var(--space-2) 0 var(--space-4);
  }

  .nav__links {
    flex-direction: column;
    gap: 0;
  }

  .nav__link {
    padding: var(--space-3) var(--space-1);
    font-size: 16px;
  }

  .nav__link[aria-current]::after,
  .nav__link:hover::after {
    right: auto;
    width: 48px;
    bottom: 6px;
  }

  .nav__search {
    min-width: 0;
  }
}
</style>
