import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PacientesApp from './PacientesApp.jsx'

const Root = window.location.hostname === 'pacientes.icarticular.cl' ? PacientesApp : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
