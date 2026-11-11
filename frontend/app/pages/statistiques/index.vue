<script setup lang="ts">
import type { Stats } from '~/types/stats'
import { countLabel, formatCount } from '~/utils/home'
import { formatPercent, formatRating, genreBars, statusBars } from '~/utils/stats'

const apiBase = useApiBase()
const {
  data: stats,
  pending,
  error,
  refresh,
} = await useFetch<Stats>(`${apiBase}/stats`, {
  // Cle stable, independante de l'URL (voir catalogue/index.vue) : partagee
  // entre le SSR et l'hydratation.
  key: 'stats',
})

const listIsEmpty = computed(() => stats.value?.totalWebtoons === 0)
const statuses = computed(() => (stats.value ? statusBars(stats.value.byStatus) : []))
const genres = computed(() => (stats.value ? genreBars(stats.value.topGenres) : []))
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Tes habitudes"
      title="Statistiques"
      subtitle="Un résumé doux et lisible de ton activité de lecture."
    />

    <p v-if="pending" class="text-secondary">Chargement des statistiques...</p>

    <div v-else-if="error" class="error-box">
      <p>Impossible de charger les statistiques pour le moment.</p>
      <AppButton variant="outline" size="sm" @click="refresh()">Réessayer</AppButton>
    </div>

    <div v-else-if="listIsEmpty" class="empty">
      <h2>Pas encore de statistiques</h2>
      <p>
        Ajoute des titres à ta liste depuis le catalogue : tes chapitres lus, tes genres préférés
        et tes meilleures notes apparaîtront ici.
      </p>
      <AppButton to="/catalogue" variant="outline" size="sm">Parcourir le catalogue</AppButton>
    </div>

    <template v-else-if="stats">
      <section class="section" aria-labelledby="overview-title">
        <h2 id="overview-title" class="sr-only">En chiffres</h2>
        <dl class="stat-row">
          <div class="stat">
            <dt class="stat__label">Titres suivis</dt>
            <dd class="stat__value">{{ formatCount(stats.totalWebtoons) }}</dd>
          </div>
          <div class="stat">
            <dt class="stat__label">Chapitres lus</dt>
            <dd class="stat__value">{{ formatCount(stats.totalChaptersRead) }}</dd>
          </div>
          <div class="stat">
            <dt class="stat__label">Terminés</dt>
            <dd class="stat__value">{{ formatCount(stats.byStatus.completed) }}</dd>
          </div>
          <!-- "Genres explores" du UI kit : non calculable, GET /api/stats ne
               renvoie que le top 3 des genres. -->
          <div class="stat">
            <dt class="stat__label">En cours</dt>
            <dd class="stat__value">{{ formatCount(stats.byStatus.reading) }}</dd>
          </div>
        </dl>
      </section>

      <!-- Graphiques : chaque ligne porte son libelle et sa valeur en texte ;
           la barre est decorative (aria-hidden), l'information ne repose
           donc ni sur la couleur ni sur la longueur. -->
      <section class="section" aria-labelledby="status-title">
        <h2 id="status-title" class="section__title">Répartition par statut</h2>
        <ul class="bars" aria-labelledby="status-title">
          <li v-for="bar in statuses" :key="bar.status" class="bar">
            <span class="bar__label">{{ STATUS_LABELS[bar.status] }}</span>
            <span class="bar__track" aria-hidden="true">
              <span
                class="bar__fill"
                :style="{ width: `${bar.percent}%`, backgroundColor: STATUS_COLORS[bar.status] }"
              />
            </span>
            <span class="bar__value">
              {{ countLabel(bar.count, 'titre', 'titres') }}, {{ formatPercent(bar.percent) }}
            </span>
          </li>
        </ul>
      </section>

      <section class="section" aria-labelledby="genres-title">
        <h2 id="genres-title" class="section__title">Genres les plus lus</h2>
        <ul v-if="genres.length > 0" class="bars" aria-labelledby="genres-title">
          <li v-for="genre in genres" :key="genre.slug" class="bar">
            <span class="bar__label">{{ genre.name }}</span>
            <span class="bar__track" aria-hidden="true">
              <span class="bar__fill bar__fill--accent" :style="{ width: `${genre.width}%` }" />
            </span>
            <span class="bar__value">{{ countLabel(genre.count, 'titre', 'titres') }}</span>
          </li>
        </ul>
        <p v-else class="section__empty">
          Aucun genre pour l'instant : les titres de ta liste n'ont pas encore de genre renseigné.
        </p>
      </section>

      <section class="section" aria-labelledby="rated-title">
        <h2 id="rated-title" class="section__title">Tes mieux notés</h2>
        <ol v-if="stats.topRated.length > 0" class="rated">
          <li v-for="(entry, index) in stats.topRated" :key="entry.id" class="rated__item">
            <span class="rated__rank">{{ index + 1 }}</span>
            <AppCover
              class="rated__cover"
              :src="entry.webtoon.coverUrl"
              :title="entry.webtoon.title"
              :webtoon-id="entry.webtoon.id"
            />
            <div class="rated__text">
              <NuxtLink :to="`/catalogue/${entry.webtoon.id}`" class="rated__title">
                {{ entry.webtoon.title }}
              </NuxtLink>
              <span class="rated__author">{{ entry.webtoon.author }}</span>
            </div>
            <span class="rated__rating">
              {{ formatRating(entry.rating) }}<span class="rated__scale"> / 10</span>
            </span>
          </li>
        </ol>
        <p v-else class="section__empty">
          Aucune note pour l'instant : note tes lectures depuis ta liste pour voir ici ton top 5.
        </p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-7);
}

.section__title {
  margin: 0;
  font-size: var(--fs-h2);
}

.section__empty,
.bars,
.rated {
  margin: 0;
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.section__empty {
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.bars,
.rated {
  list-style: none;
}

/* .bar-row du UI kit : libelle, piste, valeur. Les colonnes sont portees par
   la liste et partagees par subgrid : la colonne de valeur prend la largeur
   de la plus longue valeur, donc toutes les pistes ont la meme longueur. */
.bars {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
}

.bar {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-line-soft);
}

.bar:last-child {
  border-bottom: 0;
}

.bar__label {
  font-size: var(--fs-small);
}

.bar__track {
  height: 6px;
  overflow: hidden;
  background-color: var(--color-bg-sunken);
  border-radius: var(--radius-sm);
}

.bar__fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-sm);
}

.bar__fill--accent {
  background-color: var(--color-accent);
}

/* --color-text-soft : le gris du UI kit echoue en AA a 14px. */
.bar__value {
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text-soft);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.rated__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-line-soft);
}

.rated__item:last-child {
  border-bottom: 0;
}

/* Le dore du UI kit (--color-accent-shade : 2.84:1 sur blanc) echoue meme en
   grand texte : --color-focus, l'or sombre du projet, atteint 4.78:1. */
.rated__rank {
  flex-shrink: 0;
  width: 28px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 24px;
  color: var(--color-focus);
}

.rated__cover {
  flex-shrink: 0;
  width: 36px;
  border-radius: var(--radius-sm);
}

.rated__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.rated__title {
  font-weight: 600;
  font-size: var(--fs-body);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.rated__title:hover {
  text-decoration: underline;
}

.rated__author {
  font-size: var(--fs-small);
  font-style: italic;
  color: var(--color-text-soft);
}

.rated__rating {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;
}

.rated__scale {
  font-weight: 400;
  font-size: var(--fs-small);
  font-style: italic;
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

.empty h2 {
  margin: 0;
  font-size: var(--fs-h3);
}

.empty p {
  max-width: 420px;
  margin: 0 0 var(--space-2);
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

/* Mobile : libelle et valeur sur une ligne, barre pleine largeur dessous. */
@media (max-width: 639px) {
  .bars,
  .rated,
  .section__empty {
    padding: var(--space-3) var(--space-4);
  }

  .bars {
    display: block;
  }

  .bar {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: var(--space-2);
  }

  .bar__track {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
