import fs from 'node:fs/promises'

const isFileOrDirExists = async (path: string) => {
  try {
    const stats = await fs.stat(path)
    return stats.isFile() || stats.isDirectory()
  } catch (error) {
    console.error(
      `Unexpected error while checking path ${path}: 
      ${error instanceof Error ? error.message : error}`
    )

    throw new Error(
      `Error checking path ${path}: 
      ${error instanceof Error ? error.message : error}`
    )
  }
}

export { isFileOrDirExists }
