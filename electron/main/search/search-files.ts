import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import pLimit from 'p-limit'
import type { SearchResult } from '../../@types/search-result'
import { isFileOrDirExists } from './utils/is-file-or-dir-exists'
import { execAsyncCommand } from '../../utils/exec-async-command'
import { SearchError } from '../../errors/search-error'
import { RECENT_FILES_CACHE } from '../../store/recent-files-cache'

type RecentFileEntry = {
  path: string
  fileName: string
}

const concurrencyLimit = pLimit(10)

const USER_DIRECTORIES_TO_SEARCH = [
  'Desktop',
  'Documents',
  'Downloads',
  'Music',
  'Pictures',
  'Videos',
]

const parseRecentFiles = (
  recentFileData: string,
  userHomeDirectory: string
): SearchResult[] => {
  return recentFileData
    .split('\n')
    .filter(Boolean)
    .map(recentFileEntry => {
      try {
        const { path: filePath, fileName }: RecentFileEntry =
          JSON.parse(recentFileEntry)

        const shortenedPath = filePath.replace(userHomeDirectory, '~')

        if (!RECENT_FILES_CACHE.has(filePath)) {
          const recentFile: SearchResult = {
            type: 'recentFile',
            name: fileName,
            path: filePath,
            description: shortenedPath,
            icon: null,
            categories: null,
          }
          RECENT_FILES_CACHE.set(filePath, recentFile)
          return recentFile
        }

        return RECENT_FILES_CACHE.get(filePath)
      } catch (error) {
        console.error(
          `Unexpected error while parse recent file entry ${recentFileEntry}: 
          ${error instanceof Error ? error.message : error}`
        )

        throw new SearchError(
          `Failed to parse recent file entry ${recentFileEntry}: 
          ${error instanceof Error ? error.message : error}`
        )
      }
    })
    .filter((parsedFile): parsedFile is SearchResult => !!parsedFile)
}

const searchFilesInDirectory = async (
  directoryPath: string,
  searchQuery: string,
  userHomeDirectory: string
): Promise<SearchResult[]> => {
  try {
    const fileNamesInDirectory = await fs.readdir(directoryPath)
    const shortenedDirectoryPath = directoryPath.replace(userHomeDirectory, '~')

    const matchingFiles = await Promise.allSettled<SearchResult | undefined>(
      fileNamesInDirectory.map(async currentFileName => {
        const currentFilePath = path.join(directoryPath, currentFileName)

        if (
          (await isFileOrDirExists(currentFilePath)) &&
          currentFileName.toLowerCase().includes(searchQuery)
        ) {
          return {
            type: 'file',
            name: currentFileName,
            path: currentFilePath,
            description: shortenedDirectoryPath,
            icon: null,
            categories: null,
          } satisfies SearchResult
        }
      })
    )

    return matchingFiles.reduce<SearchResult[]>((acc, result) => {
      if (
        result.status === 'fulfilled' &&
        result.value &&
        !RECENT_FILES_CACHE.has(result.value.path)
      ) {
        acc.push(result.value)
      }
      return acc
    }, [])
  } catch (error) {
    console.error(
      `Unexpected error while reading directory ${directoryPath}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error reading directory ${directoryPath}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

const searchFiles = async (searchQuery: string): Promise<SearchResult[]> => {
  const lowerCaseSearchQuery = searchQuery.toLowerCase()
  const userHomeDirectory = os.homedir()

  const fetchRecentFilesCommand = `
    grep -i "<bookmark.*href=\\"file://.*${searchQuery}" $HOME/.local/share/recently-used.xbel | \
    sed -E 's/.*href="file:\\/\\/([^"]+)".*/\\1/' | \
    sed 's/%20/ /g' | \
    xargs -I {} bash -c 'echo "{\\"path\\": \\"{}\\", \\"fileName\\": \\"$(basename "{}")\\"}"'
  `

  try {
    const { stdout: recentFilesOutput } = await execAsyncCommand(
      fetchRecentFilesCommand
    )

    const recentFiles = parseRecentFiles(recentFilesOutput, userHomeDirectory)

    const directoriesToSearch = USER_DIRECTORIES_TO_SEARCH.map(directoryName =>
      path.join(userHomeDirectory, directoryName)
    )

    const directorySearchTasks = directoriesToSearch.map(directoryPath =>
      concurrencyLimit(() =>
        searchFilesInDirectory(
          directoryPath,
          lowerCaseSearchQuery,
          userHomeDirectory
        )
      )
    )

    const directorySearchResults = (
      await Promise.allSettled<Promise<SearchResult[]>>(directorySearchTasks)
    ).flatMap(result => (result.status === 'fulfilled' ? result.value : []))

    return [...directorySearchResults, ...recentFiles]
  } catch (error) {
    console.error(
      `Unexpected error while searching files: 
       ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error searching files: 
       ${error instanceof Error ? error.message : error}`
    )
  }
}

export { searchFiles }
