import { app, BrowserWindow, ipcMain } from 'electron'
import { createWindow, windowManager } from './create-window'
import { registerHotkey } from './hotkey-manager'
import { TOGGLE_SPOTLIGHT_HOTKEY } from '../constants/hotkeys'
import type { SearchResult } from '../@types/search-result'
import { search } from './search'

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    windowManager.window = null
  }
})

app.on('activate', () => {
  if (!BrowserWindow.getAllWindows().length) createWindow()
})

app.on('browser-window-blur', () => {
  windowManager.window?.isVisible() && windowManager.window.hide()
})

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
  console.log(`[ELECTRON](log): Resizing window to: ${width}x${height}`)
  windowManager.window?.setBounds({ width, height }, true)
}

const handleSearch = async (
  _event: Electron.IpcMainInvokeEvent,
  query: string
): Promise<SearchResult[]> => {
  console.log(`[ELECTRON](log): Searching for: ${query}`)

  try {
    return await search(query)
  } catch (error) {
    console.error('[ELECTRON](error): Search failed:', error)
    return []
  }
}

ipcMain.handle('search', handleSearch)
ipcMain.handle('resizeWindow', handleResizeWindow)

app
  .whenReady()
  .then(() => registerHotkey(TOGGLE_SPOTLIGHT_HOTKEY, toggleWindow))
  .then(createWindow)
  .catch(error => {
    console.error('[ELECTRON](error): Error during app initialization: ', error)
  })
