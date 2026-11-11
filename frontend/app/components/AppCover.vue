<script setup lang="ts">
/*
 * Couverture d'un webtoon au format 2:3 (ratio fixe : pas de saut de mise en
 * page pendant le chargement). La largeur vient du parent. Repli local aux
 * couleurs de la charte (initiales du titre, aucune requete externe) si
 * l'URL est absente ou si l'image ne se charge pas.
 */
const props = defineProps<{
  src?: string | null
  title: string
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
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth === 0) failed.value = true
})

const label = computed(() => `Couverture de ${props.title}`)
const initials = computed(() =>
  props.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
)
</script>

<template>
  <div class="app-cover">
    <img
      v-if="src && !failed"
      ref="img"
      :src="src"
      :alt="label"
      width="200"
      height="300"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      class="app-cover__img"
      @error="failed = true"
    >
    <div v-else class="app-cover__fallback" role="img" :aria-label="label">
      <span aria-hidden="true">{{ initials }}</span>
    </div>
  </div>
</template>

<style scoped>
.app-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--color-beige);
  /* Taille des initiales relative a la largeur de la couverture (cqi). */
  container-type: inline-size;
}

.app-cover__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --color-text sur --color-beige : 6.5:1 (AA). Le filet dore rappelle le
   "fil" du logo, purement decoratif. */
.app-cover__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-bottom: 4px solid var(--color-accent);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(24px, 30cqi, 64px);
  color: var(--color-text);
}
</style>
