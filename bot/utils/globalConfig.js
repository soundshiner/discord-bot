// ========================================
// utils/globalConfig.js - Configuration globale centralisée
// ========================================

let cachedConfig = null;

/**
 * Charge la configuration globale depuis les variables d'environnement
 */
export function getGlobalConfig () {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    // Configuration Discord
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',

    // Configuration API
    apiPort: parseInt(process.env.API_PORT, 10) || 3000,
    apiToken: process.env.API_TOKEN || '',

    // Configuration générale
    nodeEnv: process.env.NODE_ENV || 'dev',
    isDev: process.env.NODE_ENV === 'dev',
    isProd: process.env.NODE_ENV === 'prod'
  };

  return cachedConfig;
}

/**
 * Obtient une valeur de configuration spécifique
 */
export function getConfigValue (key, defaultValue = undefined) {
  const config = getGlobalConfig();
  return config[key] ?? defaultValue;
}

/**
 * Valide la configuration requise
 */
export function validateConfig () {
  const config = getGlobalConfig();
  const required = ['token', 'clientId'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Configuration manquante: ${missing.join(', ')}`);
  }

  return true;
}

export default getGlobalConfig;
