<script setup lang="ts">
/*
 * Couverture d'un webtoon au format 3:4 (ratio fixe : pas de saut de mise en
 * page pendant le chargement). La largeur vient du parent. Si l'URL est
 * absente ou si l'image ne se charge pas : couverture generee (decision V4),
 * degrade choisi par hash de l'id du webtoon + pile de livres du UI kit,
 * sans aucune requete externe.
 */
const props = defineProps<{
  src?: string | null
  title: string
  webtoonId: string
}>()

const failed = ref(false)
const img = ref<HTMLImageElement | null>(null)

watch(
  () => props.src,
  () => {
    failed.value = false
  }
)

// En SSR, l'image peut echouer avant l'hydratation, donc avant que @error ne
// soit branche : on verifie son etat au montage (complete + largeur nulle =
// image cassee ; une image lazy pas encore chargee n'est pas "complete").
// shortcut: faux positif possible (SVG sans dimensions intrinseques sous
// Firefox) si l'echec survient avant l'hydratation ; passer a un rendu client
// seul de l'img si cela gene.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth === 0) failed.value = true
})

const gradient = computed(() => coverGradientFor(props.webtoonId))

// Pile de livres du UI kit (atoms.jsx, Cover) : largeurs rapportees a une
// couverture de 266px pour suivre la taille de la couverture.
const BOOKS = [
  { width: '19%', opacity: 0.85 },
  { width: '24%', opacity: 0.75 },
  { width: '21%', opacity: 0.65 },
  { width: '26%', opacity: 0.55 },
]
</script>

<template>
  <div class="app-cover">
    <img
      v-if="src && !failed"
      ref="img"
      :src="src"
      :alt="`Couverture de ${title}`"
      width="300"
      height="400"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      class="app-cover__img"
      @error="failed = true"
    >
    <!-- Decoratif : aucune information, le titre est affiche a cote. -->
    <div
      v-else
      class="app-cover__generated"
      :style="{ background: gradient }"
      aria-hidden="true"
    >
      <span class="app-cover__books">
        <span
          v-for="(book, index) in BOOKS"
          :key="index"
          class="app-cover__book"
          :style="{ width: book.width, opacity: book.opacity }"
        />
      </span>
    </div>
  </div>
</template>

<style scoped>
.app-cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-bg-sunken);
  /* Taille de la pile de livres relative a la largeur (cqi). */
  container-type: inline-size;
}

.app-cover__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-cover__generated {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}

.app-cover__books {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1cqi;
  width: 100%;
  opacity: 0.55;
}

.app-cover__book {
  display: block;
  height: 4.5cqi;
  border-radius: 3px;
  background-color: var(--color-surface);
}
</style>
