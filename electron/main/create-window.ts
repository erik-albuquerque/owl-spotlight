import path from 'node:path'
import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron'

import {
  RENDERER_DIST,
  VITE_DEV_SERVER_URL,
  __DIR_NAME,
} from '../constants/env'
import { WINDOW } from '../constants/ui'

export const windowManager = {
  window: null as BrowserWindow | null,
}

const browserWindowOptions = {
  width: WINDOW.width,
  minWidth: WINDOW.width,
  height: WINDOW.height,
  frame: false,
  resizable: false,
  alwaysOnTop: true,
  webPreferences: {
    preload: path.join(__DIR_NAME, 'preload.mjs'),
    nodeIntegration: true,
    nodeIntegrationInSubFrames: false,
    contextIsolation: false,
  },
} satisfies BrowserWindowConstructorOptions

const createWindow = () => {
  windowManager.window = new BrowserWindow(browserWindowOptions)

  windowManager.window.setAlwaysOnTop(true)

  windowManager.window.webContents.on('did-finish-load', () => {
    windowManager.window?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    )
  })

  if (VITE_DEV_SERVER_URL) {
    windowManager.window.loadURL(VITE_DEV_SERVER_URL)
  } else {
    windowManager.window.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

export { createWindow }
