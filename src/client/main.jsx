import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Capturador de errores crítico para debug en producción
window.onerror = function(msg, url, line) {
  const debugDiv = document.getElementById('loading-debug');
  if (debugDiv) debugDiv.innerHTML = `<div style="color:red;padding:20px;">
    <b>Error Crítico:</b><br/>${msg}<br/>
    <small>Línea: ${line}</small>
  </div>`;
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
