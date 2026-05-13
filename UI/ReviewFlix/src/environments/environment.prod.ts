/**
 * Production: base URL of the Nest API (scheme + host, no trailing slash), e.g. https://api.example.com.
 * Replace before shipping; CI can overwrite this file or use a custom build configuration.
 * If the static host rewrites /api to the backend (same deploy), you may use '/api' instead.
 *
 * CORS: set Backend FRONTEND_URL to this app’s public origin (comma-separated if multiple), not the API host.
 */
export const environment = {
  production: true,
  apiUrl: '__API_URL__',
};
