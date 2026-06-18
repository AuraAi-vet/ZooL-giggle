import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './lib/i18n';
import { registerSW } from 'virtual:pwa-register';
import { Analytics } from '@vercel/analytics/react';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
      <Analytics />
    </LanguageProvider>
  </React.StrictMode>
);
