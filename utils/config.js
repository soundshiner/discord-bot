// ========================================
// utils/config.js - Configuration centralisée
// ========================================

let cachedConfig = null;

/**
 * Charge la configuration depuis les variables d'environnement
 */
export function config() {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    apiPort: parseInt(process.env.API_PORT) || 3000
  };

  return cachedConfig;
}

export default config;
