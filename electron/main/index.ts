import { app, BrowserWindow } from 'electron'
import { createWindow, windowManager } from './create-window'

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    windowManager.window = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
