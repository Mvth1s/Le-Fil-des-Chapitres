/*
 * Calculs de la page Statistiques (fonctions pures, testables sans Nuxt).
 */
import type { StatsTopGenre } from '~/types/stats'
import { USER_WEBTOON_STATUSES, type UserWebtoonStatus } from '~/types/user-webtoon'

export interface StatusBar {
  status: UserWebtoonStatus
  count: number
  // Part de la liste, entier de 0 a 100 ; la somme des 5 statuts vaut 100.
  percent: number
}

export interface GenreBar extends StatsTopGenre {
  // Longueur de la barre en %, relative au genre le plus lu (UI kit).
  width: number
}

/**
 * Pourcentages entiers dont la somme vaut exactement 100 (methode du plus
 * fort reste) : un arrondi simple donnerait 99 ou 101 (ex. 3 x 33,3 %).
 * Total nul : tout a 0.
 */
export function roundedPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return counts.map(() => 0)
  const raw = counts.map((count) => (count / total) * 100)
  const result = raw.map(Math.floor)
  let missing = 100 - result.reduce((sum, value) => sum + value, 0)
  // Les points manquants vont aux plus grandes parties decimales (a egalite, l'ordre d'origine).
  const byRemainder = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
  for (const { index } of byRemainder) {
    if (missing === 0) break
    result[index]! += 1
    missing -= 1
  }
  return result
}

// Une barre par statut, dans l'ordre du UI kit (en cours, termine, en pause, abandonne, a lire).
export function statusBars(byStatus: Record<UserWebtoonStatus, number>): StatusBar[] {
  const counts = USER_WEBTOON_STATUSES.map((status) => byStatus[status])
  const percents = roundedPercentages(counts)
  return USER_WEBTOON_STATUSES.map((status, index) => ({
    status,
    count: counts[index]!,
    percent: percents[index]!,
  }))
}

// Ordre recu de l'API conserve (deja trie par nombre decroissant).
export function genreBars(topGenres: StatsTopGenre[]): GenreBar[] {
  const max = Math.max(0, ...topGenres.map((genre) => genre.count))
  return topGenres.map((genre) => ({
    ...genre,
    width: max === 0 ? 0 : Math.round((genre.count / max) * 100),
  }))
}

const percentFormat = new Intl.NumberFormat('fr-FR', { style: 'percent' })
const ratingFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

// 25 => "25 %" (espace insecable fine du francais, fournie par Intl).
export function formatPercent(percent: number): string {
  return percentFormat.format(percent / 100)
}

// 8.5 => "8,5" ; 9 => "9".
export function formatRating(rating: number): string {
  return ratingFormat.format(rating)
}
