// ========================================
// bot/config.js (ESM) - Version améliorée avec support Airtable
// ========================================

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import logger from './logger.js';

// Obtenir __dirname façon ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer l'environnement
const env = process.env.NODE_ENV || 'dev';

// Charger les .env commun + spécifique
const baseEnvPath = path.join(__dirname, '../.env');
const envSpecificPath = path.join(__dirname, `../.env.${env}`);

if (fs.existsSync(baseEnvPath)) dotenv.config({ path: baseEnvPath });
if (fs.existsSync(envSpecificPath)) dotenv.config({ path: envSpecificPath });

// Fonction utilitaire
function getEnvVar (name, required = true, defaultValue = undefined) {
  const value = process.env[name] ?? defaultValue;
  if (required && (value === undefined || value === '')) {
    throw new Error(
      `La variable d'environnement ${name} est obligatoire mais non définie.`
    );
  }
  return value;
}

// Variables d'environnement requises pour le bot de base
const requiredVars = [
  'DISCORD_TOKEN',
  'ADMIN_ROLE_ID',
  'VOICE_CHANNEL_ID',
  'PLAYLIST_CHANNEL_ID'
];

// Variables optionnelles avec des valeurs par défaut
const optionalVars = [
  'UNSPLASH_ACCESS_KEY',
  'STREAM_URL',
  'JSON_URL',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID'
];

// Vérification des variables requises
const missingRequiredVars = requiredVars.filter(
  (varName) => !process.env[varName] || process.env[varName] === ''
);

if (missingRequiredVars.length > 0) {
  throw new Error(
    `Variables d'environnement obligatoires manquantes : ${missingRequiredVars.join(', ')}`
  );
}

// Vérification des variables optionnelles avec avertissements
const missingOptionalVars = optionalVars.filter(
  (varName) => !process.env[varName] || process.env[varName] === ''
);

if (missingOptionalVars.length > 0) {
  /* eslint-disable no-console */
  console.warn(`Variables d'environnement optionnelles manquantes : ${missingOptionalVars.join(', ')}`);
  console.warn('Certaines fonctionnalités pourraient être désactivées.');
  /* eslint-enable no-console */
}

// Configuration spécifique au bot
const botConfig = {
  // Environnement
  NODE_ENV: env,
  isDev: env === 'dev',
  isProd: env === 'prod',

  // Discord - Obligatoires
  DISCORD_TOKEN: getEnvVar('DISCORD_TOKEN'),
  ADMIN_ROLE_ID: getEnvVar('ADMIN_ROLE_ID'),
  VOICE_CHANNEL_ID: getEnvVar('VOICE_CHANNEL_ID'),
  PLAYLIST_CHANNEL_ID: getEnvVar('PLAYLIST_CHANNEL_ID'),

  // Discord - Optionnels
  BOT_ROLE_NAME: getEnvVar('BOT_ROLE_NAME', false, 'soundSHINE'),
  DEV_GUILD_ID: getEnvVar('DEV_GUILD_ID', false),
  CLIENT_ID: getEnvVar('CLIENT_ID', false),
  GUILD_ID: getEnvVar('GUILD_ID', false),

  // Services externes - Optionnels
  UNSPLASH_ACCESS_KEY: getEnvVar('UNSPLASH_ACCESS_KEY', false),
  STREAM_URL: getEnvVar('STREAM_URL', false),
  JSON_URL: getEnvVar('JSON_URL', false),

  // Airtable - Optionnels
  AIRTABLE_API_KEY: getEnvVar('AIRTABLE_API_KEY', false),
  AIRTABLE_BASE_ID: getEnvVar('AIRTABLE_BASE_ID', false),

  // API et logs
  API_TOKEN: getEnvVar('API_TOKEN', false),
  API_PORT: getEnvVar('API_PORT', false, '3000'),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', false, 'info'),

  // IDs spécifiques (à ajuster selon vos besoins)
  roleId: '1381014207788613693',
  channelId: '1385772202716299264',

  // Fonctions utilitaires
  hasAirtable () {
    return !!(this.AIRTABLE_API_KEY && this.AIRTABLE_BASE_ID);
  },

  hasUnsplash () {
    return !!this.UNSPLASH_ACCESS_KEY;
  },

  hasStreamService () {
    return !!(this.STREAM_URL && this.JSON_URL);
  },

  // Validation de l'état de la configuration
  validateServices () {
    const services = {
      airtable: this.hasAirtable(),
      unsplash: this.hasUnsplash(),
      streaming: this.hasStreamService()
    };

    logger.info('\n🔧 État des services :');
    logger.info(`   Airtable: ${services.airtable ? '✅ Configuré' : '❌ Non configuré'}`);
    logger.info(`   Unsplash: ${services.unsplash ? '✅ Configuré' : '❌ Non configuré'}`);
    logger.info(`   Streaming: ${services.streaming ? '✅ Configuré' : '❌ Non configuré'}`);

    return services;
  }
};

// Valider les services au démarrage si on n'est pas en test
if (process.env.NODE_ENV !== 'test') {
  botConfig.validateServices();
}

export default botConfig;
