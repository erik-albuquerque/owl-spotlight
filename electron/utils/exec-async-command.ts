import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsyncCommand = promisify(exec)

export { execAsyncCommand }
