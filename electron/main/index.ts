import { app, BrowserWindow, ipcMain } from 'electron'
import { createWindow, windowManager } from './create-window'
import { registerHotkey } from './hotkey-manager'
import { TOGGLE_SPOTLIGHT_HOTKEY } from '../constants/hotkeys'
import type { SearchFile, SearchResult } from '../@types/search-result'
import { search } from './search'
import { SearchError } from '../errors/search-error'
import { executeItem } from './search/utils/execute-item'

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    windowManager.window = null
  }
})

app.on('activate', () => {
  if (!BrowserWindow.getAllWindows().length) createWindow()
})

// app.on('browser-window-blur', () => {
//   windowManager.window?.isVisible() && windowManager.window.hide()
// })

const toggleWindow = (): void => {
  if (windowManager.window?.isVisible()) {
    windowManager.window.blur() // once for blurring the content of the window(?)
    windowManager.window.blur() // twice somehow restores focus to prev foreground window
    windowManager.window.hide()
  } else {
    windowManager.window?.show()
    windowManager.window?.focus()
  }
}

const handleResizeWindow = async (
  _event: Electron.IpcMainInvokeEvent,
  { width, height }: { width: number; height: number }
): Promise<void> => {
  windowManager.window?.setBounds({ width, height }, true)
}

const handleSearch = async (
  _event: Electron.IpcMainInvokeEvent,
  query: string
): Promise<(SearchResult | SearchFile)[]> => {
  try {
    return await search(query)
  } catch (error) {
    console.error(
      `[ELECTRON](error): Search failed: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Search failed:
      ${error instanceof Error ? error.message : error}`
    )
  }
}

const handleExecuteItem = async (
  _event: Electron.IpcMainInvokeEvent,
  item: SearchResult | SearchFile
) => {
  try {
    return await executeItem(item)
  } catch (error) {
    console.error(
      `[ELECTRON](error): Error executing item: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error executing item:
      ${error instanceof Error ? error.message : error}`
    )
  }
}

ipcMain.handle('search', handleSearch)
ipcMain.handle('resizeWindow', handleResizeWindow)
ipcMain.handle('executeItem', handleExecuteItem)

app
  .whenReady()
  .then(() => registerHotkey(TOGGLE_SPOTLIGHT_HOTKEY, toggleWindow))
  .then(createWindow)
  .catch(error => {
    console.error('[ELECTRON](error): Error during app initialization: ', error)
  })
