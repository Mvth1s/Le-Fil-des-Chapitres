import type { UserWebtoonStatus } from '~/types/user-webtoon'

// Couleur de la pastille de chaque statut (UI kit, ou paused = on_hold et
// plan = plan_to_read). Decorative : le libelle reste en --color-text.
export const STATUS_COLORS: Record<UserWebtoonStatus, string> = {
  reading: 'var(--color-primary)',
  completed: 'var(--color-blue)',
  on_hold: 'var(--color-beige)',
  dropped: 'var(--color-rose)',
  plan_to_read: 'var(--color-text-muted)',
}
