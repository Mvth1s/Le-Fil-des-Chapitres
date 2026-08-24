import type { UserWebtoonStatus } from '~/types/user-webtoon'

// Libelles francais des statuts, partages entre la liste de lecture et les
// statistiques (voir pages/liste/index.vue et pages/statistiques/index.vue).
export const STATUS_LABELS: Record<UserWebtoonStatus, string> = {
  reading: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  dropped: 'Abandonné',
  plan_to_read: 'À lire',
}
