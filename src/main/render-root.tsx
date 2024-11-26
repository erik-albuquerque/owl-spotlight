import React from 'react'
import ReactDOM from 'react-dom/client'

const RenderRoot = (children: React.ReactNode): void => {
  // biome-ignore lint/correctness/noVoidTypeReturn: <explanation>
  return ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{children}</React.StrictMode>
  )
}

export { RenderRoot }