import { app } from 'electron'
import _path from 'node:path'
import fsPromises from 'node:fs/promises'
import fs, { type FSWatcher } from 'node:fs'
import os from 'node:os'
import type { SearchFile } from '../../@types/search-result'
import { SearchError } from '../../errors/search-error'

let RECENT_FILES_PATHS_CACHE: string[] | null = null
const ICON_CACHE = new Map<string, string | null>()

const HOME_DIR = os.homedir()
const RECENT_FILES_PATH = _path.join(
  HOME_DIR,
  '.local/share/recently-used.xbel'
)
const URI_EXTRACTION_REGEX = /<bookmark\s+href="([^"]+)"/g

let RECENTLY_USED_FILE_WATCHER: FSWatcher | null = null

const generateShortPath = (path: string): string => {
  const directoryPath = _path.dirname(path)

  if (directoryPath.startsWith(HOME_DIR)) {
    return `~${directoryPath.substring(HOME_DIR.length)}`
  }

  return directoryPath + _path.sep
}

const processFilePath = async (path: string): Promise<SearchFile | null> => {
  const fileName = _path.basename(path)

  let icon = ICON_CACHE.get(path)

  if (icon === undefined) {
    const nativeIcon = await app
      .getFileIcon(path, { size: 'normal' })
      .catch(() => null)
    icon = nativeIcon ? nativeIcon.toDataURL() : null

    ICON_CACHE.set(path, icon)
  }

  const shortPath = generateShortPath(path)

  return {
    type: 'file',
    name: fileName,
    path,
    icon,
    shortPath,
  } satisfies SearchFile
}

const loadRecentFilesCache = async (): Promise<void> => {
  if (RECENT_FILES_PATHS_CACHE !== null) {
    return
  }

  try {
    const recentFilesContent = await fsPromises.readFile(
      RECENT_FILES_PATH,
      'utf-8'
    )

    const paths: string[] = []

    URI_EXTRACTION_REGEX.lastIndex = 0

    let matchFile: RegExpExecArray | null

    while (
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
      (matchFile = URI_EXTRACTION_REGEX.exec(recentFilesContent)) !== null
    ) {
      const fileURI = matchFile[1]

      if (fileURI.startsWith('file://')) {
        const filePath = decodeURIComponent(fileURI.replace('file://', ''))
        paths.push(filePath)
      }
    }

    RECENT_FILES_PATHS_CACHE = paths

    if (RECENTLY_USED_FILE_WATCHER === null) {
      RECENTLY_USED_FILE_WATCHER = fs.watch(
        RECENT_FILES_PATH,
        (eventType, _filename) => {
          console.log(
            `[ELECTRON](log)<cache>: Update recently used file: ${eventType}. Invalidating cache.`
          )
          RECENT_FILES_PATHS_CACHE = null
        }
      )

      RECENTLY_USED_FILE_WATCHER.on('error', error => {
        console.error(
          '[ELECTRON](log)<cache>: Erro on recently used watcher:',
          error
        )

        RECENTLY_USED_FILE_WATCHER?.close()
        RECENTLY_USED_FILE_WATCHER = null
      })
    }
  } catch (error) {
    console.error(`[ELECTRON](log) Error on read ${RECENT_FILES_PATH}.`, error)
    RECENT_FILES_PATHS_CACHE = []
  }
}

const searchFiles = async (query: string): Promise<SearchFile[]> => {
  try {
    await loadRecentFilesCache()

    if (!RECENT_FILES_PATHS_CACHE || RECENT_FILES_PATHS_CACHE.length === 0) {
      return []
    }

    const lowerCaseQuery = query.toLowerCase()

    const filesToProcess = RECENT_FILES_PATHS_CACHE.filter(filePath => {
      return _path.basename(filePath).toLowerCase().includes(lowerCaseQuery)
    })

    const filePromises = filesToProcess.map(filePath =>
      processFilePath(filePath)
    )

    const files = await Promise.all(filePromises)

    return files.filter(file => file !== null) as SearchFile[]
  } catch (error) {
    console.error(
      `Unexpected error while searching file ${query}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error searching file ${query}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { searchFiles }
