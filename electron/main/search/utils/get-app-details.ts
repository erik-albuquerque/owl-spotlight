import path from 'node:path'
import fs from 'node:fs/promises'

import type { SearchResult } from '../../../@types/search-result'
import { parseAppCategories } from './parse-app-categories'
import { parseDesktopFile } from './parse-desktop-file'
import { SearchError } from '../../../errors/search-error'
import { execAsyncCommand } from '../../../utils/exec-async-command'

let cachedCurrentIconTheme: string | null = null

const CACHED_ICONS = new Map<string, string>()

const ICON_BASE_DIRS = [
  '/usr/share/icons',
  path.join(process.env.HOME || '', '.icons'),
  '/var/lib/flatpak/exports/share/icons',
]
const ICON_SIZES = [128, 96, 64, 48, 32, 24]

const ICON_CATEGORIES = [
  'apps',
  'actions',
  'categories',
  'devices',
  'mimetypes',
  'places',
  'status',
]

let CACHED_FALLBACK_PATH: string | null = null

const getCurrentIconTheme = async (): Promise<string> => {
  if (cachedCurrentIconTheme) return cachedCurrentIconTheme

  try {
    const { stdout: currentIconTheme } = await execAsyncCommand(
      'gsettings get org.gnome.desktop.interface icon-theme'
    )

    cachedCurrentIconTheme = currentIconTheme.replace(/'/g, '').trim()
    return cachedCurrentIconTheme
  } catch (error) {
    console.error(
      `[ELECTRON](error): Couldn't read icon theme: ${
        error instanceof Error ? error.message : error
      }`
    )

    throw new SearchError(
      `Couldn't read icon theme: ${error instanceof Error ? error.message : error}`
    )
  }
}

const getFallbackIconPath = async (): Promise<string> => {
  if (CACHED_FALLBACK_PATH !== null) {
    return CACHED_FALLBACK_PATH
  }

  const currentTheme = await getCurrentIconTheme()
  const baseTheme = currentTheme.split('-')[0]
  const searchThemes = new Set([currentTheme, baseTheme, 'hicolor'])

  for (const baseDir of ICON_BASE_DIRS) {
    for (const theme of searchThemes) {
      const themePath = path.join(baseDir, theme)

      for (const size of ICON_SIZES) {
        for (const sizeDir of [`${size}x${size}`, `${size}`]) {
          const basePath = path.join(themePath, sizeDir, 'mimetypes', 'unknown')

          for (const ext of ['.png', '.svg']) {
            const filePath = `${basePath}${ext}`
            try {
              await fs.access(filePath)
              CACHED_FALLBACK_PATH = filePath
              return filePath
            } catch {}
          }
        }
      }
    }
  }

  CACHED_FALLBACK_PATH = ''
  return ''
}

const resolveAppIconByTheme = async (iconName: string): Promise<string> => {
  if (CACHED_ICONS.has(iconName)) return CACHED_ICONS.get(iconName)!

  const currentTheme = await getCurrentIconTheme()
  const baseTheme = currentTheme.split('-')[0]

  const searchThemes = new Set([currentTheme, baseTheme, 'hicolor'])

  const potentialPaths: string[] = []

  for (const baseDir of ICON_BASE_DIRS) {
    for (const theme of searchThemes) {
      const themePath = path.join(baseDir, theme)

      potentialPaths.push(
        path.join(themePath, 'scalable', 'apps', `${iconName}.svg`)
      )

      for (const size of ICON_SIZES) {
        for (const sizeDir of [`${size}x${size}`, `${size}`]) {
          for (const category of ICON_CATEGORIES) {
            const basePath = path.join(themePath, sizeDir, category, iconName)
            potentialPaths.push(`${basePath}.svg`)
            potentialPaths.push(`${basePath}.png`)
          }
        }
      }
    }
  }

  for (const filePath of potentialPaths) {
    try {
      await fs.access(filePath)
      CACHED_ICONS.set(iconName, filePath)
      return filePath
    } catch {}
  }

  const fallbackPath = await getFallbackIconPath()

  CACHED_ICONS.set(iconName, fallbackPath)

  return fallbackPath
}

const getAppDetails = async (appPath: string): Promise<SearchResult> => {
  try {
    const fileContent = await fs.readFile(appPath, 'utf-8')

    const icon = await resolveAppIconByTheme(
      parseDesktopFile(fileContent, 'Icon') ||
        path.basename(appPath, '.desktop')
    )

    return {
      type: 'app',
      icon,
      name:
        parseDesktopFile(fileContent, 'Name') ||
        path.basename(appPath, '.desktop'),
      description:
        parseDesktopFile(fileContent, 'Comment') ||
        parseDesktopFile(fileContent, 'GenericName'),
      categories: parseAppCategories(
        parseDesktopFile(fileContent, 'Categories')
      ),
      path: appPath,
    } satisfies SearchResult
  } catch (error) {
    console.error(
      `[ELECTRON](error): Unexpected error while fetching app details ${appPath}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error fetching app details ${appPath}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { getAppDetails }
