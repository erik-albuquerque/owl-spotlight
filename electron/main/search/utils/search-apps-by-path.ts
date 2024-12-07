import { SearchError } from '../../../errors/search-error'
import { APP_CACHE } from '../../../store/app-cache'
import { execAsyncCommand } from '../../../utils/exec-async-command'
import { promiseLimit } from '../../../utils/promise-limit'
import { getAppDetails } from './get-app-details'

const searchAppsByPath = async (
  basePath: string,
  findOptions: string
): Promise<void> => {
  const command = `find ${basePath} ${findOptions} 2>/dev/null`

  try {
    const { stdout } = await execAsyncCommand(command)
    const appPaths = stdout.split('\n').filter(Boolean)

    const tasks = appPaths.map(appPath =>
      promiseLimit(async () => {
        try {
          const app = await getAppDetails(appPath)

          if (!APP_CACHE.has(app.name)) APP_CACHE.set(app.name, app)
        } catch (error) {
          throw new SearchError(
            `Error processing app at ${appPath}: 
            ${error instanceof Error ? error.message : error}`
          )
        }
      })
    )

    await Promise.all(tasks)
  } catch (error) {
    throw new SearchError(
      `Error searching apps in ${basePath}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { searchAppsByPath }
