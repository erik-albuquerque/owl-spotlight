type SearchResult = {
  type: 'app' | 'file' | 'recentFile'
  name: string
  path: string
  icon: string | null
  description: string | null
  categories: string[] | null
}

export type { SearchResult }
