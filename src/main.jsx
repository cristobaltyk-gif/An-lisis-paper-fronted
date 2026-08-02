import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PacientesApp from './PacientesApp.jsx'

const hostnamesPacientes = ['pacientes.icarticular.cl', 'aprende.hipokratia.health']
const Root = hostnamesPacientes.includes(window.location.hostname) ? PacientesApp : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
