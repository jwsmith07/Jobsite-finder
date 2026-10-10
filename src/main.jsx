import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { prepareClientRoot } from './lib/marketingSnapshot'
import './index.css'

const rootElement = prepareClientRoot(document.getElementById('root'))
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
