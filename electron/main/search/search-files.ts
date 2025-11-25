import path from 'node:path'
import fs from 'node:fs/promises'
import { app } from 'electron'
import type { SearchFile } from '../../@types/search-result'

const RECENT_FILES_PATH = path.join(
  process.env.HOME || '',
  '.local/share/recently-used.xbel'
)

const URI_EXTRACTION_REGEX = /<bookmark\s+href="([^"]+)"/g

const processFilePath = async (
  filePath: string,
  query: string
): Promise<SearchFile | null> => {
  const fileName = path.basename(filePath)

  if (!fileName.toLowerCase().includes(query)) return null

  const nativeIcon = await app.getFileIcon(filePath, { size: 'normal' })

  const icon = nativeIcon ? nativeIcon.toDataURL() : null

  return {
    type: 'file',
    name: fileName,
    path: filePath,
    icon,
  } satisfies SearchFile
}

const searchFiles = async (query: string): Promise<SearchFile[]> => {
  const lowerCaseQuery = query.toLowerCase()

  try {
    const recentFilesContent = await fs.readFile(RECENT_FILES_PATH, 'utf-8')

    let matchFile: RegExpExecArray | null = null
    const filePromises: Promise<SearchFile | null>[] = []

    matchFile = URI_EXTRACTION_REGEX.exec(recentFilesContent)
    
    while (matchFile !== null) {
      const fileURI = matchFile[1]

      if (fileURI.startsWith('file://')) {
        const filePath = decodeURIComponent(fileURI.replace('file://', ''))

        filePromises.push(processFilePath(filePath, lowerCaseQuery))
      }

      matchFile = URI_EXTRACTION_REGEX.exec(recentFilesContent)
    }

    const files = await Promise.all(filePromises)

    return files.filter(file => file !== null) as SearchFile[]
  } catch (error) {
    return []
  }
}

export { searchFiles }
