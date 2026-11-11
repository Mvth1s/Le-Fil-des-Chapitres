export interface Genre {
  id: string
  name: string
  slug: string
}

export interface Webtoon {
  id: string
  title: string
  author: string
  description: string | null
  coverUrl: string | null
  chaptersTotal: number | null
  link: string | null
  createdAt: string
  updatedAt: string
  genres: Genre[]
}

// Payload envoye a POST /api/webtoons et PUT /api/webtoons/:id. Les champs
// optionnels absents (undefined) ne sont pas serialises dans le JSON envoye :
// cote backend, un champ absent signifie "ne pas modifier" (voir
// webtoons_controller.ts#update), pas "effacer".
export interface WebtoonFormPayload {
  title: string
  author: string
  description?: string
  coverUrl?: string
  chaptersTotal?: number
  link?: string
  genreIds: string[]
}
