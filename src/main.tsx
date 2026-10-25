import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('GNIOT Lost & Found AI: New update available, updating service worker...');
  },
  onOfflineReady() {
    console.log('GNIOT Lost & Found AI: Offline caching enabled.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
