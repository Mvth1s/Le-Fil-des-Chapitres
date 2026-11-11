import type { Ref } from 'vue'

/**
 * Renvoie une copie de `source` qui ne se met a jour qu'apres `delay` ms sans
 * nouvelle modification. Le timer est annule au demontage du composant
 * (ou a l'arret du scope d'effets) pour ne pas ecrire apres coup.
 * Exception : une chaine vide (champ efface, reinitialisation) s'applique
 * immediatement, pour ne pas afficher 300 ms de resultats encore filtres.
 */
export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Readonly<Ref<T>> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    if (value === '') {
      debounced.value = value
      return
    }
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => {
    clearTimeout(timer)
  })

  return readonly(debounced) as Readonly<Ref<T>>
}
