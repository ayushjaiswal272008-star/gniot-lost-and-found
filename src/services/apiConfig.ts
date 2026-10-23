// Central API Configuration & Backend Resolver
// Prevents blind relative /api/ requests on static hosts like GitHub Pages

export function getBackendBaseUrl(): string | null {
  // 1. Explicitly configured backend URL (e.g. Render, Railway, Cloud Run)
  const envBackendUrl = (import.meta.env.VITE_BACKEND_URL || '').trim();
  if (envBackendUrl) {
    return envBackendUrl.replace(/\/+$/, '');
  }

  // 2. Check environment in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // On GitHub Pages (*.github.io), there is no backend running at domain root.
    // Making relative /api/ calls causes 404 errors.
    if (hostname.endsWith('github.io')) {
      return null;
    }

    // Local development or Docker container running Express fullstack on port 3000
    if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.port === '3000') {
      return '';
    }
  }

  return null;
}

export function isBackendConfigured(): boolean {
  return getBackendBaseUrl() !== null;
}
