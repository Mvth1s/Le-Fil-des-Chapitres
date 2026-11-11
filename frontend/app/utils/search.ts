// Normalise une chaine pour une recherche insensible a la casse et aux
// accents : NFD separe chaque lettre accentuee en lettre de base + signe
// diacritique combinant (U+0300 a U+036F), qu'on retire ensuite.
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
