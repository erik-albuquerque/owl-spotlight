import { searchAppsByPath } from './utils/search-apps-by-path'

const searchApps = async (): Promise<void> => {
  const appsPath = '/usr/share/applications'
  const findOptions = '-type f'

  await searchAppsByPath(appsPath, findOptions)
}

export { searchApps }
