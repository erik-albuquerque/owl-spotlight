import type { SearchResult } from '../../@types/search-result'
import { SearchError } from '../../errors/search-error'
import { APP_CACHE } from '../../store/app-cache'
import { searchApps } from './search-apps'
import { searchFlatpakApps } from './search-flatpak-apps'

const MAX_VISIBLE_APPS = 10 // 10 apps

const search = async (query: string): Promise<SearchResult[]> => {
  try {
    const lowerQuery = query.toLowerCase()

    const results = Array.from(APP_CACHE.values())
      .filter(app => app.name.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_VISIBLE_APPS)

    if (results.length === 0) {
      await searchFlatpakApps()
      await searchApps()
    }

    return results
  } catch (error) {
    throw new SearchError(
      `Error searching for "${query}": ${error instanceof Error ? error.message : error}`
    )
  }
}

export { search }
