import type { UserWebtoonStatus } from '~/types/user-webtoon'

// Valeurs brutes du formulaire d'edition : les champs numeriques valent
// string | number (voir AppInput.vue, type="number"), les dates sont au
// format YYYY-MM-DD de <input type="date">, '' quand le champ est vide.
export interface ReadingEntryFormValues {
  status: UserWebtoonStatus
  chaptersRead: string | number
  rating: string | number
  comment: string
  startedAt: string
  finishedAt: string
}

// Corps de PUT /api/user/list/:id (backend/app/validators/update_user_webtoon.ts).
// Le formulaire envoie toujours les quatre champs facultatifs : null efface
// la valeur cote serveur (un null deja nul est sans effet, inutile donc de
// comparer avec la valeur initiale de l'entree).
export interface ReadingEntryPayload {
  status: UserWebtoonStatus
  chaptersRead: number
  rating: number | null
  comment: string | null
  startedAt: string | null
  finishedAt: string | null
}

function isBlank(value: string | number) {
  return String(value).trim() === ''
}

// Message d'erreur ('' si valide) pour un nombre de chapitres lus saisi.
// Partage entre la saisie directe de la carte et le formulaire d'edition.
export function validateChaptersRead(value: string | number, chaptersTotal: number | null): string {
  if (isBlank(value)) return 'Indique le nombre de chapitres lus.'
  const chapters = Number(value)
  if (!Number.isInteger(chapters) || chapters < 0) {
    return 'Le nombre de chapitres doit être un entier positif ou nul.'
  }
  if (chaptersTotal !== null && chapters > chaptersTotal) {
    return `Ce webtoon compte ${String(chaptersTotal)} chapitres au maximum.`
  }
  return ''
}

// Erreurs par champ, avec les memes cles que les erreurs VineJS du serveur
// (voir extractValidationErrors) pour les afficher au meme endroit.
export function validateReadingEntry(
  values: ReadingEntryFormValues,
  chaptersTotal: number | null
): Record<string, string> {
  const errors: Record<string, string> = {}

  const chaptersError = validateChaptersRead(values.chaptersRead, chaptersTotal)
  if (chaptersError) errors.chaptersRead = chaptersError

  if (!isBlank(values.rating)) {
    const rating = Number(values.rating)
    // rating * 2 entier : pas de 0,5 (0, 0.5, 1, ..., 10).
    if (Number.isNaN(rating) || rating < 0 || rating > 10 || !Number.isInteger(rating * 2)) {
      errors.rating = 'La note doit être comprise entre 0 et 10, par pas de 0,5.'
    }
  }

  // Comparaison de chaines valable : format YYYY-MM-DD de <input type="date">.
  if (values.startedAt !== '' && values.finishedAt !== '' && values.finishedAt < values.startedAt) {
    errors.finishedAt = 'La date de fin ne peut pas précéder la date de début.'
  }

  return errors
}

export function toReadingEntryPayload(values: ReadingEntryFormValues): ReadingEntryPayload {
  const comment = values.comment.trim()
  return {
    status: values.status,
    chaptersRead: Number(values.chaptersRead),
    rating: isBlank(values.rating) ? null : Number(values.rating),
    comment: comment === '' ? null : comment,
    startedAt: values.startedAt === '' ? null : values.startedAt,
    finishedAt: values.finishedAt === '' ? null : values.finishedAt,
  }
}

// Erreur metier 422 sans `field` (ex. ChaptersExceedTotalException cote
// backend) : renvoie son message, ou null s'il ne s'agit pas de ce cas.
export function extractBusinessError(error: unknown): string | null {
  const { statusCode, data } = (error ?? {}) as {
    statusCode?: number
    data?: { errors?: Array<{ field?: string; message?: string }> }
  }
  if (statusCode !== 422) return null
  const item = data?.errors?.find((entry) => !entry.field && entry.message)
  return item?.message ?? null
}

// L'API peut renvoyer une date seule ou un horodatage ISO complet : on ne
// garde que la partie YYYY-MM-DD, attendue par <input type="date">.
export function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

// Affichage JJ/MM/AAAA sans passer par Date : evite le decalage de fuseau
// (une date seule est lue en UTC) et les ecarts entre SSR et navigateur.
export function formatDate(value: string): string {
  return toDateInputValue(value).split('-').reverse().join('/')
}
