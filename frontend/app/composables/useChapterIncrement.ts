import type { Ref } from 'vue'
import type { UserWebtoon } from '~/types/user-webtoon'

/*
 * "+1 chapitre" depuis une WebtoonCard (accueil, catalogue). `entries` est la
 * donnee de useFetch('user-list') : la remplacer suffit a mettre a jour toutes
 * les pages qui partagent cette cle. Pas de mise a jour optimiste : le bouton
 * est inactif (busy) le temps de la requete. pages/liste garde sa propre
 * logique (optimiste, saisie directe).
 */
export function useChapterIncrement(entries: Ref<UserWebtoon[] | undefined>) {
  const apiBase = useApiBase()
  const toast = useToast()
  const pendingIds = reactive(new Set<string>())

  // Renvoie l'entree mise a jour par le serveur (le statut peut passer a
  // "completed"), ou null en cas d'echec (toast deja affiche).
  async function increment(entry: UserWebtoon): Promise<UserWebtoon | null> {
    if (pendingIds.has(entry.id)) return null
    pendingIds.add(entry.id)
    try {
      const updated = await $fetch<UserWebtoon>(`${apiBase}/user/list/${entry.id}/progress`, {
        method: 'PATCH',
        body: { chaptersRead: entry.chaptersRead + 1 },
      })
      // data de useFetch est un shallowRef : on remplace le tableau. webtoon
      // est conserve (la reponse PATCH ne precharge pas ses genres).
      entries.value = (entries.value ?? []).map((item) =>
        item.id === entry.id ? { ...item, ...updated, webtoon: item.webtoon } : item
      )
      return updated
    } catch (error) {
      toast.error(
        extractBusinessError(error) ??
          Object.values(extractValidationErrors(error))[0] ??
          'La mise à jour de la progression a échoué. Réessaie dans un instant.'
      )
      return null
    } finally {
      pendingIds.delete(entry.id)
    }
  }

  return { increment, pendingIds }
}
