import { searchAppsByPath } from './utils/search-apps-by-path'

export const searchFlatpakApps = async (): Promise<void> => {
  const flatpakPath = '/var/lib/flatpak/exports/share/applications'
  const findOptions = '-type l -exec realpath {} \\;'

  await searchAppsByPath(flatpakPath, findOptions)
}
