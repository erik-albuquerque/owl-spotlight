import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { shell } from 'electron'
import type { SearchResult, SearchFile } from '../../../@types/search-result'
import { SearchError } from '../../../errors/search-error'
import { parseDesktopFile } from './parse-desktop-file'

const executeItem = async (item: SearchResult | SearchFile) => {
  if (item.type === 'file') {
    return await shell.openPath(item.path)
  }

  const itemContent = await fs.readFile(item.path, 'utf-8')

  const commandToExecuteItem = parseDesktopFile(itemContent, 'Exec')
    ?.replace(/%[a-zA-Z]/g, '')
    .trim()

  if (!commandToExecuteItem) {
    console.error(
      `[ELECTRON](error): No executable command found in desktop file: ${item.path}`
    )
    throw new SearchError(
      `No executable command found in desktop file: ${item.path}`
    )
  }

  console.log(`[ELECTRON](log): Executing: ${commandToExecuteItem}`)

  try {
    exec(commandToExecuteItem)
  } catch (error) {
    console.error(
      `[ELECTRON](error):  Unexpected error while executing item: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error on executing item:
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { executeItem }
