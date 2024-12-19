import path from 'node:path'
import fs from 'node:fs/promises'

import type { SearchResult } from '../../../@types/search-result'
import { parseAppCategories } from './parse-app-categories'
import { parseDesktopFile } from './parse-desktop-file'
import { SearchError } from '../../../errors/search-error'

const getAppDetails = async (appPath: string): Promise<SearchResult> => {
  try {
    const fileContent = await fs.readFile(appPath, 'utf-8')

    const name =
      parseDesktopFile(fileContent, 'Name') ||
      path.basename(appPath, '.desktop')
    const description =
      parseDesktopFile(fileContent, 'Comment') ||
      parseDesktopFile(fileContent, 'GenericName')

    const categories = parseAppCategories(
      parseDesktopFile(fileContent, 'Categories')
    )

    return {
      type: 'app',
      icon: null,
      name,
      description,
      path: appPath,
      categories,
    } satisfies SearchResult
  } catch (error) {
    console.error(
      `[ELECTRON](error): Unexpected error while fetching app details ${appPath}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error fetching app details ${appPath}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { getAppDetails }
