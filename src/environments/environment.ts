/**
 * Configuration de développement.
 * apiUrl pointe vers le backend Spring Boot (port 8080).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  jitsiDomain: 'meet.jit.si',
  tokenStorageKey: 'odc_access_token',
};