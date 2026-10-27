import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { NoticeProvider } from './contexts/NoticeContext'
import AppErrorBoundary from './components/AppErrorBoundary'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <NoticeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NoticeProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
