import '@/lib/recoveryRedirect'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { startRetiredCompanyGuard } from '@/lib/retiredCompanyGuard'

startRetiredCompanyGuard()

ReactDOM.createRoot(document.getElementById('root')).render(
  
  <App />
)
