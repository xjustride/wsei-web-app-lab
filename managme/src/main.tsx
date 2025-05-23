import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("BŁĄD KRYTYCZNY: Google Client ID (VITE_GOOGLE_CLIENT_ID) nie jest zdefiniowany. Sprawdź plik .env i konfigurację Vite.");
  // Możesz tu nawet rzucić błąd lub wyświetlić komunikat użytkownikowi,
  // bo bez tego ID logowanie Google nie zadziała.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Upewnij się, że googleClientId nie jest undefined */}
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
