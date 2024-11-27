import { app, BrowserWindow } from 'electron'
import { createWindow, windowManager } from './create-window'
import { registerHotkey } from './hotkey-manager'
import { TOGGLE_SPOTLIGHT_HOTKEY } from '../constants/hotkeys'

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

app
  .whenReady()
  .then(() => {
    registerHotkey(TOGGLE_SPOTLIGHT_HOTKEY, () => {
      if (windowManager.window) {
        const isWindowVisible = windowManager.window.isVisible()

        if (isWindowVisible) {
          windowManager.window.blur()
          windowManager.window.hide()
        } else {
          windowManager.window.show()
          windowManager.window.focus()
        }
      }
    })
  })
  .then(createWindow)
  .catch(error => {
    console.error('Error during app initialization: ', error)
  })
