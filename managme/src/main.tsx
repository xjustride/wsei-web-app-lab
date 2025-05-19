import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
  import { GoogleOAuthProvider } from '@react-oauth/google'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!googleClientId) {
  console.error('Google Client ID is not defined. Please check your .env file.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || 'YOUR_GOOGLE_CLIENT_ID_FALLBACK_IF_NEEDED_OR_EMPTY_STRING'}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
