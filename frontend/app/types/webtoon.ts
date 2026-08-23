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
