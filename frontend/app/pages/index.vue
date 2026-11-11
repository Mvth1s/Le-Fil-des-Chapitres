<script setup lang="ts">
import type { Stats } from '~/types/stats'
import type { UserWebtoon } from '~/types/user-webtoon'
import type { Webtoon } from '~/types/webtoon'
import { filterAndSortWebtoons } from '~/utils/catalogue'
import { countLabel, formatCount, greetingFor, readingCountLine } from '~/utils/home'

const apiBase = useApiBase()
// Memes cles que /statistiques, /liste et /catalogue : les pages partagent le
// cache plutot que de refetcher. Appels lances en parallele.
const [
  { data: stats, pending, error, refresh },
  { data: entries, error: listError, refresh: refreshList },
  { data: webtoons, error: webtoonsError, refresh: refreshWebtoons },
] = await Promise.all([
  useFetch<Stats>(`${apiBase}/stats`, { key: 'stats' }),
  useFetch<UserWebtoon[]>(`${apiBase}/user/list`, { key: 'user-list' }),
  useFetch<Webtoon[]>(`${apiBase}/webtoons`, { key: 'webtoons-list' }),
])

// Heure lue apres montage seulement : celle du serveur (SSR) peut differer de
// celle du navigateur, ce qui casserait l'hydratation.
const hour = ref<number | null>(null)
onMounted(() => {
  hour.value = new Date().getHours()
})
const greeting = computed(() => (hour.value === null ? 'Bonjour,' : greetingFor(hour.value)))

const listIsEmpty = computed(() => stats.value?.totalWebtoons === 0)

// GET /api/user/list trie deja par updatedAt desc (voir user_list_controller.ts)
// : les 4 premiers webtoons "en cours" sont donc les plus recemment repris.
const readingEntries = computed(() =>
  (entries.value ?? []).filter((entry) => entry.status === 'reading').slice(0, 4)
)
const planCount = computed(
  () => (entries.value ?? []).filter((entry) => entry.status === 'plan_to_read').length
)

const entryByWebtoonId = computed(
  () => new Map((entries.value ?? []).map((entry) => [entry.webtoonId, entry]))
)
const statusByWebtoonId = computed(
  () => new Map((entries.value ?? []).map((entry) => [entry.webtoonId, entry.status]))
)
// Tri "recent" du catalogue (createdAt desc, puis titre), sans filtre.
const recentItems = computed(() =>
  filterAndSortWebtoons(
    webtoons.value ?? [],
    { search: '', genreId: '', status: '', author: '', sort: 'recent' },
    statusByWebtoonId.value
  )
    .slice(0, 4)
    // Entree de liste si le titre y est (chip de statut), sinon le webtoon seul.
    .map((webtoon) => entryByWebtoonId.value.get(webtoon.id) ?? webtoon)
)

const { increment, pendingIds } = useChapterIncrement(entries)

const readingSection = ref<HTMLElement | null>(null)
const readingHeading = ref<HTMLElement | null>(null)
const announcement = ref('')

// Patch local pour l'affichage immediat, puis $fetch en arriere-plan pour
// resynchroniser la cle 'stats' partagee avec /statistiques (topRated...) :
// refresh() repasserait pending a true et masquerait le tableau de bord.
// fromReading : +1 clique dans "En cours", ou la carte disparait si l'entree est terminee.
async function handleIncrement(entry: UserWebtoon, fromReading = false) {
  const index = fromReading ? readingEntries.value.findIndex((item) => item.id === entry.id) : -1
  const updated = await increment(entry)
  if (!updated) return
  if (updated.status !== 'reading' && index !== -1) {
    await moveFocusAfterRemoval(index, entry.webtoon.title)
  }
  if (!stats.value) return
  const byStatus = { ...stats.value.byStatus }
  byStatus[entry.status] -= 1
  byStatus[updated.status] += 1
  stats.value = {
    ...stats.value,
    totalChaptersRead: stats.value.totalChaptersRead + updated.chaptersRead - entry.chaptersRead,
    byStatus,
  }
  $fetch<Stats>(`${apiBase}/stats`)
    .then((fresh) => {
      stats.value = fresh
    })
    // Echec silencieux : le patch local reste affiche, /statistiques refetch a la navigation.
    .catch(() => {})
}

// La carte terminee quitte "En cours" avec le bouton qui avait le focus : on
// le reporte sur la carte qui prend sa place (ou la precedente), sinon sur le
// titre de section, pour ne pas renvoyer le clavier en haut de page.
async function moveFocusAfterRemoval(index: number, title: string) {
  announcement.value = `${title} : terminé, retiré des lectures en cours.`
  await nextTick()
  const links = readingSection.value?.querySelectorAll<HTMLElement>('.wt-card__open') ?? []
  const target = links[index] ?? links[index - 1] ?? readingHeading.value
  target?.focus()
}
</script>

<template>
  <main class="page">
    <p v-if="pending" class="text-secondary">Chargement...</p>

    <div v-else-if="error" class="error-box">
      <h1>Le Fil des Chapitres</h1>
      <p>Impossible de charger le tableau de bord pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <template v-else-if="stats">
      <div class="hero">
        <div class="hero__text">
          <p class="hero__eyebrow">Webtoon tracker</p>
          <h1 v-if="listIsEmpty" class="hero__title">
            Bienvenue,<br>
            ta liste de lecture t'attend.
          </h1>
          <h1 v-else class="hero__title">
            {{ greeting }}<br>
            {{ readingCountLine(stats.byStatus.reading) }}
          </h1>

          <p v-if="listIsEmpty" class="hero__lead">
            Parcours le catalogue et ajoute un premier titre à ta liste pour suivre ta progression
            chapitre après chapitre.
          </p>
          <p v-else class="hero__lead">
            Tu as lu
            <strong>{{ countLabel(stats.totalChaptersRead, 'chapitre', 'chapitres') }}</strong>
            au fil de <strong>{{ countLabel(stats.totalWebtoons, 'titre', 'titres') }}</strong>.
            Reprends là où tu en es, ou parcours le catalogue pour découvrir un nouveau récit.
          </p>

          <div class="hero__actions">
            <template v-if="listIsEmpty">
              <AppButton to="/catalogue" class="hero__cta">Parcourir le catalogue</AppButton>
              <AppButton to="/catalogue/new" variant="outline">Ajouter un webtoon</AppButton>
            </template>
            <template v-else>
              <AppButton to="/liste" class="hero__cta">Reprendre la lecture</AppButton>
              <AppButton to="/catalogue" variant="outline">Parcourir le catalogue</AppButton>
            </template>
          </div>
        </div>
        <div class="hero__logo">
          <img src="/logo-square.png" alt="" width="200" height="200">
        </div>
      </div>

      <section v-if="!listIsEmpty" ref="readingSection" class="section" aria-labelledby="reading-title">
        <div class="section__head">
          <h2 id="reading-title" ref="readingHeading" class="section__title" tabindex="-1">
            En cours
          </h2>
          <NuxtLink to="/liste" class="section__link">Voir ma liste →</NuxtLink>
        </div>
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>

        <div v-if="listError" class="error-box">
          <p>Impossible de charger tes lectures en cours.</p>
          <AppButton variant="outline" size="sm" @click="refreshList()">Réessayer</AppButton>
        </div>

        <div v-else-if="readingEntries.length > 0" class="wt-grid">
          <WebtoonCard
            v-for="entry in readingEntries"
            :key="entry.id"
            :item="entry"
            :busy="pendingIds.has(entry.id)"
            @increment="handleIncrement(entry, true)"
          />
        </div>

        <div v-else class="empty">
          <h3>Aucune lecture en cours</h3>
          <template v-if="planCount > 0">
            <p>
              Tu as {{ countLabel(planCount, 'titre', 'titres') }} à lire dans ta liste : c'est le
              moment d'en commencer un.
            </p>
            <AppButton to="/liste" variant="outline" size="sm">Choisir dans ma liste</AppButton>
          </template>
          <template v-else>
            <p>Trouve ton prochain récit dans le catalogue.</p>
            <AppButton to="/catalogue" variant="outline" size="sm">Parcourir le catalogue</AppButton>
          </template>
        </div>
      </section>

      <section v-if="!listIsEmpty" class="section" aria-labelledby="overview-title">
        <div class="section__head">
          <h2 id="overview-title" class="section__title">Aperçu</h2>
        </div>
        <dl class="stat-row">
          <div class="stat">
            <dt class="stat__label">Webtoons suivis</dt>
            <dd class="stat__value">{{ formatCount(stats.totalWebtoons) }}</dd>
          </div>
          <div class="stat">
            <dt class="stat__label">En cours</dt>
            <dd class="stat__value">{{ formatCount(stats.byStatus.reading) }}</dd>
          </div>
          <div class="stat">
            <dt class="stat__label">Terminés</dt>
            <dd class="stat__value">{{ formatCount(stats.byStatus.completed) }}</dd>
          </div>
          <div class="stat">
            <dt class="stat__label">Chapitres lus</dt>
            <dd class="stat__value">{{ formatCount(stats.totalChaptersRead) }}</dd>
          </div>
        </dl>
      </section>

      <section class="section" aria-labelledby="recent-title">
        <div class="section__head">
          <h2 id="recent-title" class="section__title">Récemment ajoutés au catalogue</h2>
          <NuxtLink v-if="recentItems.length > 0" to="/catalogue" class="section__link">
            Voir le catalogue →
          </NuxtLink>
        </div>

        <div v-if="webtoonsError" class="error-box">
          <p>Impossible de charger le catalogue pour le moment.</p>
          <AppButton variant="outline" size="sm" @click="refreshWebtoons()">Réessayer</AppButton>
        </div>

        <div v-else-if="recentItems.length > 0" class="wt-grid">
          <WebtoonCard
            v-for="item in recentItems"
            :key="item.id"
            :item="item"
            :busy="pendingIds.has(item.id)"
            @increment="'webtoon' in item && handleIncrement(item)"
          />
        </div>

        <div v-else class="empty">
          <h3>Le catalogue est vide</h3>
          <p>Ajoute un premier webtoon pour commencer à construire ta bibliothèque.</p>
          <AppButton to="/catalogue/new" variant="outline" size="sm">Ajouter un webtoon</AppButton>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
/* Hero du UI kit : carte blanche, texte a gauche, logo a droite. */
.hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 36px;
  margin-bottom: 36px;
  padding: 36px 36px 32px;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

/* Lettres espacees en CSS, pas dans le texte : le lecteur d'ecran lit des mots.
   --color-text-soft : le gris du UI kit (3.5:1 sur blanc) echoue en AA. */
.hero__eyebrow {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-small);
  font-style: italic;
  letter-spacing: var(--letter-tag);
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.hero__title {
  margin: 0 0 var(--space-2);
  font-size: 38px;
  line-height: var(--lh-tight);
}

.hero__lead {
  margin: 0;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text-soft);
}

.hero__lead strong {
  color: var(--color-text);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

/* Bouton dore, texte encre (V5) : 5.03:1. `.hero` en prefixe pour l'emporter
   sur .is-primary d'AppButton. */
.hero .hero__cta {
  background-color: var(--color-accent);
  color: var(--color-on-accent);
}

.hero__logo {
  display: grid;
  place-items: center;
}

.hero__logo img {
  max-height: 200px;
  width: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 48px;
}

.section__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2) var(--space-4);
}

.section__title {
  margin: 0;
  font-size: 24px;
}

/* Le dore du UI kit en texte (~2.6:1) echoue : texte encre, dore en soulignement. */
.section__link {
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-underline-offset: 4px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin: 0;
}

.stat {
  display: flex;
  flex-direction: column-reverse;
  gap: 6px;
  padding: 20px 22px;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.stat__value {
  margin: 0;
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
}

.stat__label {
  font-size: var(--fs-small);
  font-style: italic;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  text-align: center;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.empty h3 {
  margin: 0;
  font-size: 22px;
}

.empty p {
  max-width: 380px;
  margin: 0 0 var(--space-2);
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

@media (max-width: 767px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    padding: var(--space-5);
  }

  .hero__title {
    font-size: 32px;
  }

  .hero__logo {
    display: none;
  }

  .stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3);
  }
}
</style>
