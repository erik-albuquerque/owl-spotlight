import type { SearchResult } from '../../@types/search-result'
import { SearchError } from '../../errors/search-error'
import { APP_CACHE } from '../../store/app-cache'
import { searchApps } from './search-apps'
import { searchFiles } from './search-files'
import { searchFlatpakApps } from './search-flatpak-apps'

const MAX_VISIBLE_APPS = 10 // 10 apps

const search = async (query: string): Promise<SearchResult[]> => {
  try {
    const lowerQuery = query.toLowerCase()

    const apps = Array.from(APP_CACHE.values())
      .filter(app => app.name.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_VISIBLE_APPS)

    if (apps.length === 0) {
      await searchFlatpakApps()
      await searchApps()
    }

    const files = (await searchFiles(query)).slice(0, MAX_VISIBLE_APPS)

    return [...apps, ...files]
  } catch (error) {
    console.error(
      `Unexpected error while searching for "${query}": 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error searching for "${query}": 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { search }
