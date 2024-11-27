import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const __DIR_NAME = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__DIR_NAME, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST
