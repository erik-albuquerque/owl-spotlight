import _path from 'node:path'
import fs from 'node:fs/promises'
import type { SearchResult } from '../../../@types/search-result'
import { parseAppCategories } from './parse-app-categories'
import { parseDesktopFile } from './parse-desktop-file'
import { SearchError } from '../../../errors/search-error'
import { execAsyncCommand } from '../../../utils/exec-async-command'

let cachedCurrentIconTheme: string | null = null
let CACHED_THEME_SEARCH_SET: Set<string> | null = null

const CACHED_ICONS = new Map<string, string>()

const ICON_BASE_DIRS = [
  '/usr/share/icons',
  _path.join(process.env.HOME || '', '.icons'),
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
    return cachedCurrentIconTheme || 'hicolor'
  } catch (error) {
    console.error(
      `[ELECTRON](error): Couldn't read icon theme, using hicolor: ${
        error instanceof Error ? error.message : error
      }`
    )
    return 'hicolor'
  }
}

const getThemeSearchSet = async (): Promise<Set<string>> => {
  if (CACHED_THEME_SEARCH_SET) {
    return CACHED_THEME_SEARCH_SET
  }

  const currentTheme = await getCurrentIconTheme()

  const baseTheme = currentTheme.split('-')[0]
  const themes = new Set([currentTheme, baseTheme, 'hicolor'])

  CACHED_THEME_SEARCH_SET = themes
  return themes
}

const generateIconPaths = (
  iconName: string,
  themes: Set<string>,
  categories: string[]
): string[] => {
  const paths: string[] = []

  for (const baseDir of ICON_BASE_DIRS) {
    for (const theme of themes) {
      const themePath = _path.join(baseDir, theme)

      if (categories.includes('apps') || iconName === 'unknown') {
        paths.push(_path.join(themePath, 'scalable', 'apps', `${iconName}.svg`))
      }

      for (const size of ICON_SIZES) {
        for (const sizeDir of [`${size}x${size}`, `${size}`]) {
          for (const category of categories) {
            const basePath = _path.join(themePath, sizeDir, category, iconName)
            paths.push(`${basePath}.png`)
            paths.push(`${basePath}.svg`)
          }
        }
      }
    }
  }
  return paths
}

const getFallbackIconPath = async (): Promise<string> => {
  if (CACHED_FALLBACK_PATH !== null) return CACHED_FALLBACK_PATH

  const searchThemes = await getThemeSearchSet()

  const potentialFallbackPaths = generateIconPaths('unknown', searchThemes, [
    'mimetypes',
  ])

  for (const filePath of potentialFallbackPaths) {
    try {
      await fs.access(filePath)
      CACHED_FALLBACK_PATH = filePath
      return filePath
    } catch {}
  }

  CACHED_FALLBACK_PATH = ''
  return ''
}

const resolveAppIconByTheme = async (iconName: string): Promise<string> => {
  if (CACHED_ICONS.has(iconName)) return CACHED_ICONS.get(iconName)!

  const themes = await getThemeSearchSet()

  const appPaths = generateIconPaths(iconName, themes, ICON_CATEGORIES)

  for (const appPath of appPaths) {
    try {
      await fs.access(appPath)
      CACHED_ICONS.set(iconName, appPath)
      return appPath
    } catch {}
  }

  const fallbackPath = await getFallbackIconPath()
  CACHED_ICONS.set(iconName, fallbackPath)
  return fallbackPath
}

const getAppDetails = async (
  path: string,
  content: string
): Promise<SearchResult> => {
  try {
    const icon = await resolveAppIconByTheme(
      parseDesktopFile(content, 'Icon') || _path.basename(path, '.desktop')
    )

    return {
      type: 'app',
      icon,
      path,
      name:
        parseDesktopFile(content, 'Name') || _path.basename(path, '.desktop'),
      description:
        parseDesktopFile(content, 'Comment') ||
        parseDesktopFile(content, 'GenericName'),
      categories: parseAppCategories(parseDesktopFile(content, 'Categories')),
    } satisfies SearchResult
  } catch (error) {
    console.error(
      `[ELECTRON](error): Unexpected error while fetching app details ${path}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new SearchError(
      `Error fetching app details ${path}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { getAppDetails }
