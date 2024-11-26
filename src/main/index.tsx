import { RenderRoot } from './render-root.tsx'
import { AppProvider } from '../providers/app-provider.tsx'

import './main.css'

RenderRoot(<AppProvider />)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
