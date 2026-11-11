export type GenreTone = 'sage' | 'blue' | 'rose' | 'beige' | 'neutral'

export interface TagColors {
  bg: string
  fg: string
}

// Valeurs en hexadecimal (et non en var()) pour pouvoir verifier les contrastes
// en test. Les fonds sont les tokens --color-*-tint et --color-bg-sunken.
// Chaque couple depasse 4.5:1 ; le texte beige du UI kit (#7E6A3B, 4.32:1) est
// assombri.
export const GENRE_TONE_COLORS: Record<GenreTone, TagColors> = {
  sage: { bg: '#E4E9D8', fg: '#4F5E2F' },
  blue: { bg: '#E0E9F0', fg: '#3D5970' },
  rose: { bg: '#F1DFE3', fg: '#7A4855' },
  beige: { bg: '#F0E9D6', fg: '#725F33' },
  neutral: { bg: '#F4EFE5', fg: '#3D3B2F' },
}

// Les 14 genres du referentiel (backend genre_seeder.ts), indexes par nom.
// Science-Fiction, Isekai, Sports et Historique sont absents du UI kit.
export const GENRE_TONES: Record<string, GenreTone> = {
  'Action': 'sage',
  'Comédie': 'sage',
  'Sports': 'sage',
  'Historique': 'sage',
  'Romance': 'rose',
  'Horreur': 'rose',
  'Isekai': 'rose',
  'Fantasy': 'beige',
  'Drame': 'beige',
  'Tranche de vie': 'beige',
  'Thriller': 'blue',
  'Mystère': 'blue',
  'Surnaturel': 'blue',
  'Science-Fiction': 'blue',
}

// Repli neutre pour tout genre inconnu (genre ajoute plus tard, faute de frappe).
export function genreColors(name: string): TagColors {
  return GENRE_TONE_COLORS[GENRE_TONES[name] ?? 'neutral']
}
