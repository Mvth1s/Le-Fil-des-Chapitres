/*
 * Textes de l'accueil (fonctions pures, testables sans Nuxt).
 */

const numberFormat = new Intl.NumberFormat('fr-FR')

// "2 076" (separateur de milliers francais). Intl insere U+202F, absent de
// Playfair Display : la police de secours le rend quasi invisible ("1147").
// On le remplace par U+00A0, insecable aussi et present dans la police.
export function formatCount(count: number): string {
  return numberFormat.format(count).replace(/\u202F/g, '\u00A0')
}

// "1 chapitre", "0 chapitre", "2 076 chapitres" : en francais, 0 et 1 sont au singulier.
export function countLabel(count: number, singular: string, plural: string): string {
  return `${formatCount(count)} ${count > 1 ? plural : singular}`
}

// Bonsoir de 18 h a 5 h, Bonjour le reste de la journee.
export function greetingFor(hour: number): 'Bonjour,' | 'Bonsoir,' {
  return hour >= 18 || hour < 5 ? 'Bonsoir,' : 'Bonjour,'
}

export function readingCountLine(reading: number): string {
  return reading === 0
    ? "tu n'as aucun webtoon en cours."
    : `tu as ${countLabel(reading, 'webtoon', 'webtoons')} en cours.`
}
