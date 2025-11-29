import type { SearchFile, SearchResult } from '../../@types/search-result'
import { SearchError } from '../../errors/search-error'
import { APP_CACHE } from '../../store/app-cache'
import { searchApps } from './search-apps'
import { searchFiles } from './search-files'
import { searchFlatpakApps } from './search-flatpak-apps'

const MAX_VISIBLE_ITEMS = 10 // 10 apps

const search = async (
  query: string
): Promise<(SearchResult | SearchFile)[]> => {
  try {
    const lowerQuery = query.toLowerCase() 

    if (APP_CACHE.size === 0) {
      await searchFlatpakApps()
      await searchApps()
    }

    const apps = Array.from(APP_CACHE.values())
      .filter(app => app.name.toLowerCase().includes(lowerQuery))
      .slice(0, MAX_VISIBLE_ITEMS)

    const files = (await searchFiles(lowerQuery)).slice(0, MAX_VISIBLE_ITEMS)

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
