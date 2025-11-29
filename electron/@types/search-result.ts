type SearchResult = {
  type: 'app' | 'file' | 'recentFile'
  name: string
  path: string
  icon: string | null
  description: string | null
  categories: string[] | null
}

type SearchFile = Omit<SearchResult, 'description' | 'categories'> & {
  shortPath: string
}

export type { SearchResult, SearchFile }
