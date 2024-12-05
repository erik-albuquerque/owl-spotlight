import { globalShortcut } from 'electron'
import { HotkeyError } from '../errors/hotkey-error'

const registerHotkey = (hotkey: string, action: () => void) => {
  try {
    if (globalShortcut.isRegistered(hotkey)) {
      console.warn(
        `[ELECTRON](warn): Hotkey "${hotkey}" is already registered.`
      )
      throw new HotkeyError(`Hotkey "${hotkey}" is already registered.`)
    }

    const isRegistered = globalShortcut.register(hotkey, action)

    if (!isRegistered) {
      throw new HotkeyError(`Failed to register hotkey "${hotkey}".`)
    }

    console.log(`[ELECTRON](log): Hotkey "${hotkey}" registered successfully.`)
  } catch (error) {
    console.error(
      `[ELECTRON](error): Error while registering hotkey "${hotkey}":`,
      error
    )
    if (error instanceof Error) {
      throw new HotkeyError(
        `Failed to register hotkey "${hotkey}": ${error.message}`
      )
    }
  }
}

/**
 * add: unregisterHotkey and
 * unregisterAllHotkeys
 */

export { registerHotkey }
