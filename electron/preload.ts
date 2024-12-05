import { ipcRenderer, contextBridge } from 'electron'

console.log('Preload script loaded!')
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  search: (query: string) => ipcRenderer.invoke('search', query),
  resizeWindow: (query: { width: number; height: number }) =>
    ipcRenderer.invoke('resizeWindow', query),
  // You can expose other APTs you need here.
  // ...
})

console.log('API exposed to renderer')
