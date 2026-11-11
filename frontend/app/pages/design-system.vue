<script setup lang="ts">
import type { Webtoon } from '~/types/webtoon'
import { USER_WEBTOON_STATUSES, type UserWebtoon, type UserWebtoonStatus } from '~/types/user-webtoon'

const inputValue = ref('')
const selectValue = ref('reading')
const modalOpen = ref(false)
const toast = useToast()

const paletteGroups = [
  {
    title: 'Teintes',
    tokens: ['primary', 'blue', 'rose', 'beige', 'accent'],
  },
  {
    title: 'Nuances',
    tokens: ['primary-shade', 'blue-shade', 'rose-shade', 'beige-shade', 'accent-shade'],
  },
  {
    title: 'Teintes claires',
    tokens: ['primary-tint', 'blue-tint', 'rose-tint', 'beige-tint', 'accent-tint'],
  },
  {
    title: 'Neutres',
    tokens: [
      'text',
      'text-soft',
      'text-muted',
      'line',
      'line-soft',
      'bg',
      'bg-sunken',
      'surface',
    ],
  },
]

const genreNames = [...Object.keys(GENRE_TONES), 'Genre inconnu']

const typeScale = [
  { token: '--fs-display', font: 'var(--font-display)', label: 'Le Fil des Chapitres' },
  { token: '--fs-h1', font: 'var(--font-display)', label: 'Titre de page' },
  { token: '--fs-h2', font: 'var(--font-body)', label: 'Titre de section' },
  { token: '--fs-h3', font: 'var(--font-body)', label: 'Titre de carte' },
  { token: '--fs-body', font: 'var(--font-body)', label: 'Corps de texte' },
  { token: '--fs-small', font: 'var(--font-body)', label: 'Libellé, légende' },
  { token: '--fs-tag', font: 'var(--font-body)', label: 'Tag, badge' },
]

// Donnees de demonstration de WebtoonCard (aucun appel API).
function demoWebtoonOf(id: string, title: string, author: string, chaptersTotal: number | null, genres: string[]): Webtoon {
  return {
    id,
    title,
    author,
    chaptersTotal,
    description: null,
    coverUrl: null,
    link: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    genres: genres.map((name) => ({ id: name, name, slug: name })),
  }
}

function demoEntryOf(webtoon: Webtoon, status: UserWebtoonStatus, chaptersRead: number): UserWebtoon {
  return {
    id: `entry-${webtoon.id}`,
    userId: 'demo-user',
    webtoonId: webtoon.id,
    status,
    chaptersRead,
    rating: null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: webtoon.createdAt,
    updatedAt: webtoon.updatedAt,
    webtoon,
  }
}

const demoWebtoon = demoWebtoonOf('demo-1', 'Tower of God', 'SIU', 620, ['Aventure', 'Mystère', 'Action'])
const demoReading = reactive(
  demoEntryOf(demoWebtoonOf('demo-4', 'Solo Leveling', 'Chugong', 179, ['Action', 'Fantasy']), 'reading', 117)
)
const demoCompleted = demoEntryOf(
  demoWebtoonOf('demo-2', 'Lore Olympus', 'Rachel Smythe', 270, ['Romance', 'Fantasy']),
  'completed',
  270
)
const demoNoTotal = reactive(
  demoEntryOf(demoWebtoonOf('demo-5', 'Omniscient Reader', 'Sing Shong', null, ['Surnaturel']), 'reading', 73)
)

const statusOptions = [
  { label: 'En cours', value: 'reading' },
  { label: 'Terminé', value: 'completed' },
  { label: 'En pause', value: 'on_hold' },
  { label: 'Abandonné', value: 'dropped' },
  { label: 'À lire', value: 'plan_to_read' },
]
</script>

<template>
  <main class="page">
    <h1>Design system</h1>
    <p class="text-muted">
      Page de démonstration des tokens et des composants du design system (étape 5 de la roadmap,
      refonte v0.1.1). Pas destinée aux utilisateurs finaux.
    </p>

    <section>
      <h2>Palette</h2>
      <div v-for="group in paletteGroups" :key="group.title" class="palette-group">
        <h3>{{ group.title }}</h3>
        <ul class="swatches">
          <li v-for="token in group.tokens" :key="token" class="swatch">
            <span class="swatch__color" :style="{ background: `var(--color-${token})` }" />
            <code>--color-{{ token }}</code>
          </li>
        </ul>
      </div>
    </section>

    <section>
      <h2>Tokens d'accessibilité</h2>
      <ul class="a11y">
        <li>
          <span class="a11y__gold">Texte sur doré</span>
          <code>--color-on-accent</code> sur <code>--color-accent</code> : 5,03:1
        </li>
        <li>
          <span class="a11y__focus">Contour de focus</span>
          <code>--color-focus</code> sur <code>--color-bg</code> : 4,5:1
        </li>
        <li>
          <span class="a11y__field">Bordure de champ</span>
          <code>--color-field-border</code> sur <code>--color-bg</code> : 3,26:1
        </li>
      </ul>
    </section>

    <section>
      <h2>Typographie</h2>
      <ul class="type-scale">
        <li v-for="step in typeScale" :key="step.token">
          <span :style="{ fontFamily: step.font, fontSize: `var(${step.token})` }">
            {{ step.label }}
          </span>
          <code>{{ step.token }}</code>
        </li>
      </ul>
    </section>

    <section>
      <h2>Tags de genre</h2>
      <div class="row">
        <AppGenreTag v-for="name in genreNames" :key="name" :name="name" />
      </div>
    </section>

    <section>
      <h2>Dégradés de couverture</h2>
      <ul class="gradients">
        <li v-for="(gradient, key) in COVER_GRADIENTS" :key="key">
          <span class="gradients__sample" :style="{ background: gradient }" />
          <code>{{ key }}</code>
        </li>
      </ul>
    </section>

    <section>
      <h2>Boutons</h2>
      <div class="row">
        <AppButton variant="primary">Primaire</AppButton>
        <AppButton variant="secondary">Secondaire</AppButton>
        <AppButton variant="outline">Contour</AppButton>
        <AppButton variant="ghost">Discret</AppButton>
        <AppButton variant="primary" disabled>Désactivé</AppButton>
        <AppButton to="/catalogue" variant="outline">Lien interne</AppButton>
        <AppButton href="https://example.org" variant="ghost">Lien externe</AppButton>
      </div>
    </section>

    <section>
      <h2>Chips de statut</h2>
      <div class="row">
        <AppStatusChip v-for="status in USER_WEBTOON_STATUSES" :key="status" :status="status" />
      </div>
      <h3 class="subtitle">Badges (AppBadge)</h3>
      <div class="row">
        <AppBadge variant="reading">En cours</AppBadge>
        <AppBadge variant="completed">Terminé</AppBadge>
        <AppBadge variant="on_hold">En pause</AppBadge>
        <AppBadge variant="dropped">Abandonné</AppBadge>
        <AppBadge variant="plan_to_read">À lire</AppBadge>
      </div>
    </section>

    <section>
      <h2>Champs de formulaire</h2>
      <div class="row">
        <AppInput v-model="inputValue" label="Titre du webtoon" placeholder="Ex : Solo Leveling" />
        <AppInput label="Champ en erreur" error="Ce champ est obligatoire." />
        <AppInput label="Note (0 a 10)" type="number" :min="0" :max="10" :step="0.5" />
        <AppSelect v-model="selectValue" label="Statut" :options="statusOptions" />
      </div>
    </section>

    <section>
      <h2>Carte</h2>
      <AppCard style="max-width: 320px">
        <template #header>
          <h3>Solo Leveling</h3>
        </template>
        <p>Chugong, 200 chapitres</p>
        <AppBadge variant="reading">En cours</AppBadge>
        <template #footer>
          <AppButton size="sm" variant="outline">Voir la fiche</AppButton>
        </template>
      </AppCard>
    </section>

    <section>
      <h2>Couverture</h2>
      <div class="row">
        <AppCover
          class="cover-demo"
          src="/logo-icon.png"
          title="Le Fil des Chapitres"
          webtoon-id="demo-image"
        />
        <AppCover class="cover-demo" title="Tower of God" webtoon-id="demo-1" />
        <AppCover class="cover-demo" title="Lore Olympus" webtoon-id="demo-2" />
        <AppCover
          class="cover-demo"
          src="data:image/png;base64,invalide"
          title="Image cassée"
          webtoon-id="demo-3"
        />
      </div>
    </section>

    <section>
      <h2>Carte webtoon</h2>
      <p class="text-secondary">
        Webtoon hors liste, en cours (bouton +1), terminé, total inconnu, ouverture par événement.
      </p>
      <div class="wt-grid">
        <WebtoonCard :item="demoWebtoon" />
        <WebtoonCard :item="demoReading" @increment="demoReading.chaptersRead += 1" />
        <WebtoonCard :item="demoCompleted" />
        <WebtoonCard
          :item="demoNoTotal"
          open-mode="event"
          @increment="demoNoTotal.chaptersRead += 1"
          @open="toast.success('Événement open émis.')"
        />
      </div>
    </section>

    <section>
      <h2>Modale</h2>
      <AppButton variant="outline" @click="modalOpen = true">Ouvrir la modale</AppButton>
      <AppModal v-model:open="modalOpen">
        <template #title>Titre de la modale</template>
        <p>Échap, clic sur le fond ou Annuler ferment la modale. Le focus reste piégé dedans.</p>
        <template #actions>
          <AppButton variant="outline" size="sm" @click="modalOpen = false">Annuler</AppButton>
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Confirmer</AppButton>
        </template>
      </AppModal>
    </section>

    <section>
      <h2>Messages (toasts)</h2>
      <div class="row">
        <AppButton variant="outline" @click="toast.success('Opération réussie.')">
          Toast de succès
        </AppButton>
        <AppButton variant="outline" @click="toast.error('Une erreur est survenue.')">
          Toast d'erreur
        </AppButton>
      </div>
    </section>
  </main>
</template>

<style scoped>
section {
  margin-top: var(--spacing-xl);
}

.cover-demo {
  width: 140px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.palette-group + .palette-group {
  margin-top: var(--space-5);
}

.swatches,
.gradients {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-4);
}

.swatch,
.gradients li {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.swatch__color {
  height: 56px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-line);
}

.gradients__sample {
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

code {
  font-size: 14px;
}

.a11y,
.type-scale {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.a11y li,
.type-scale li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.a11y__gold,
.a11y__focus,
.a11y__field {
  font-size: 14px;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

.a11y__gold {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.a11y__focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.a11y__field {
  background: var(--color-surface);
  border: 1px solid var(--color-field-border);
}

.type-scale li {
  justify-content: space-between;
  border-bottom: 1px solid var(--color-line-soft);
  padding-bottom: var(--space-2);
}

.subtitle {
  margin-top: var(--space-4);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: flex-start;
}
</style>
