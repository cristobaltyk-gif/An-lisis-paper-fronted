// src/main.jsx — archivo completo

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PacientesApp from './PacientesApp.jsx'

// Routing simple por pathname — sin dependencias extra
const path = window.location.pathname

const Root = path.startsWith('/pacientes') ? PacientesApp : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
