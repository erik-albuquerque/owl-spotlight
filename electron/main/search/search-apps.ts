import path from 'node:path'
import fs from 'node:fs/promises'
import pLimit from 'p-limit'
import { SearchError } from '../../errors/search-error'
import type { SearchResult } from '../../@types/search-result'
import { execAsyncCommand } from '../../utils/exec-async-command'

export const APP_CACHE = new Map<string, SearchResult>()

const limit = pLimit(10)

const parseDesktopFile = (content: string, key: string): string | null => {
  const regex = new RegExp(`^${key}=(.*)$`, 'm')
  const match = content.match(regex)
  return match?.[1] || null
}

const parseAppCategories = (rawCategoryString: string | null) => {
  const allowedCategories = new Set([
    'Development',
    'Game',
    'Graphics',
    'Network',
    'AudioVideo',
    'Office',
    'Math',
    'Settings',
    'System',
    'Utility',
  ])

  const categoryMap: Record<string, string> = {
    Network: 'Internet',
    AudioVideo: 'Multimedia',
  }

  return (
    rawCategoryString
      ?.replace(/;$/, '')
      .split(';')
      .filter(category => allowedCategories.has(category))
      .map(category => categoryMap[category] || category) || null
  )
}

const getAppDetails = async (appPath: string): Promise<SearchResult> => {
  const fileContent = await fs.readFile(appPath, 'utf-8')

  const name =
    parseDesktopFile(fileContent, 'Name') || path.basename(appPath, '.desktop')
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
}

const searchApps = async (): Promise<void> => {
  const command = 'find /usr/share/applications -type f 2>/dev/null'

  try {
    const { stdout } = await execAsyncCommand(command)
    const appPaths = stdout.split('\n').filter(Boolean)

    const tasks = appPaths.map(appPath =>
      limit(async () => {
        try {
          const app = await getAppDetails(appPath)

          if (!APP_CACHE.has(app.name)) APP_CACHE.set(app.name, app)
        } catch (error) {
          throw new SearchError(
            `Error processing app ${appPath}: 
            ${error instanceof Error ? error.message : error}`
          )
        }
      })
    )

    await Promise.all(tasks)
  } catch (error) {
    throw new SearchError(
      `Error on search app: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { searchApps }
