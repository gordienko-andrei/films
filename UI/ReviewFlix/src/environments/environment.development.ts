export const environment = {
  production: false,
  ssr: false,
  /** Через proxy.conf.json → Nest на :3000; куки с SameSite=Lax идут с тем же origin, что и Angular. */
  apiUrl: '/api',
}; 