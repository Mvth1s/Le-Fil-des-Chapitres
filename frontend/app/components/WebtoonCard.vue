<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoon } from '~/types/user-webtoon'

/*
 * Carte webtoon du UI kit (webtoon-card.jsx). `item` est soit un webtoon du
 * catalogue (pas dans la liste : ni chip ni progression), soit une entree de
 * la liste de lecture (chip de statut, progression, "+1 chapitre" si en cours).
 */
const props = withDefaults(
  defineProps<{
    item: Webtoon | UserWebtoon
    // 'link' : le titre est un lien vers la fiche ; 'event' : le titre est un
    // bouton qui emet `open` (ex. modale de la liste de lecture).
    openMode?: 'link' | 'event'
    // Requete en cours pour cette entree : le +1 reste focusable mais inactif.
    busy?: boolean
  }>(),
  { openMode: 'link', busy: false }
)

const emit = defineEmits<{
  open: []
  increment: []
}>()

const entry = computed(() => ('webtoon' in props.item ? props.item : null))
const webtoon = computed(() => ('webtoon' in props.item ? props.item.webtoon : props.item))

const total = computed(() => webtoon.value.chaptersTotal)
const progress = computed(() =>
  entry.value && total.value
    ? Math.min(100, Math.round((entry.value.chaptersRead / total.value) * 100))
    : null
)
const canIncrement = computed(
  () =>
    entry.value?.status === 'reading' &&
    (total.value === null || entry.value.chaptersRead < total.value)
)

function onIncrement() {
  if (!props.busy) emit('increment')
}
</script>

<template>
  <article class="wt-card">
    <div class="wt-card__media">
      <AppCover
        :src="webtoon.coverUrl"
        :title="webtoon.title"
        :webtoon-id="webtoon.id"
        class="wt-card__cover"
      />
      <AppStatusChip v-if="entry" :status="entry.status" class="wt-card__chip" />
    </div>

    <div class="wt-card__body">
      <h3 class="wt-card__title">
        <!-- Lien (ou bouton) etire sur toute la carte via ::after : la carte
             entiere est cliquable sans imbriquer le bouton +1 dans un lien. -->
        <NuxtLink
          v-if="openMode === 'link'"
          :to="`/catalogue/${webtoon.id}`"
          class="wt-card__open"
        >
          {{ webtoon.title }}
        </NuxtLink>
        <button v-else type="button" class="wt-card__open" @click="emit('open')">
          {{ webtoon.title }}
        </button>
      </h3>
      <p class="wt-card__author">{{ webtoon.author }}</p>

      <div v-if="webtoon.genres.length > 0" class="wt-card__genres">
        <AppGenreTag v-for="genre in webtoon.genres.slice(0, 2)" :key="genre.id" :name="genre.name" />
      </div>

      <div v-if="progress !== null" class="wt-card__progress" aria-hidden="true">
        <div class="wt-card__progress-bar" :style="{ width: `${progress}%` }" />
      </div>

      <div class="wt-card__foot">
        <span v-if="entry" class="wt-card__chapters" aria-live="polite">
          Ch. {{ entry.chaptersRead }}<template v-if="total"> / {{ total }}</template>
        </span>
        <span v-else-if="total" class="wt-card__chapters">{{ total }} chapitres</span>
        <button
          v-if="canIncrement"
          type="button"
          class="wt-card__plus"
          :aria-label="`+1 chapitre, ${webtoon.title}`"
          :aria-disabled="busy"
          @click="onIncrement"
        >
          +1 chapitre
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.wt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition:
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.wt-card:hover {
  box-shadow: var(--shadow-lift);
  border-color: var(--color-accent);
}

/* Le focus du lien etire est reporte sur la carte entiere. */
.wt-card:has(.wt-card__open:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.wt-card__media {
  position: relative;
}

/* Bord superieur arrondi par la carte (overflow: hidden). */
.wt-card__cover {
  border-radius: 0;
}

.wt-card__chip {
  position: absolute;
  top: 10px;
  left: 10px;
}

.wt-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 16px;
}

.wt-card__title {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 17px;
  line-height: var(--lh-snug);
  overflow-wrap: anywhere;
}

.wt-card__open {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  color: var(--color-text);
  text-decoration: none;
  cursor: pointer;
}

.wt-card__open::after {
  content: '';
  position: absolute;
  inset: 0;
}

.wt-card__open:focus-visible {
  outline: none;
}

/* --color-text-soft sur blanc : 6.9:1 (le gris du UI kit, 3.5:1, echoue). */
.wt-card__author,
.wt-card__chapters {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--color-text-soft);
}

.wt-card__author {
  font-style: italic;
}

.wt-card__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.wt-card__progress {
  height: 4px;
  margin-top: 10px;
  border-radius: 4px;
  background-color: var(--color-bg-sunken);
  overflow: hidden;
}

.wt-card__progress-bar {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 240ms ease;
}

/* margin-top: auto : le pied reste en bas quand les cartes d'une ligne
   n'ont pas le meme contenu. */
.wt-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

/* Au-dessus du ::after du lien etire pour recevoir son propre clic. Texte
   en --color-on-accent (V5) : 5.03:1 sur --color-accent. Le survol passe sur
   la teinte claire, la nuance foncee (--color-accent-shade) tombant a ~4:1. */
.wt-card__plus {
  position: relative;
  z-index: 1;
  padding: 5px 11px;
  border: 0;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: var(--fs-small);
  color: var(--color-on-accent);
  background-color: var(--color-accent);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.wt-card__plus:hover {
  background-color: var(--color-accent-tint);
}

.wt-card__plus[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
