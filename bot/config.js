// ========================================
// bot/config.js (ESM)
// ========================================

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

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

// Validation des variables d'environnement requises pour le bot
const requiredVars = [
  'DISCORD_TOKEN',
  'UNSPLASH_ACCESS_KEY',
  'STREAM_URL',
  'JSON_URL',
  'ADMIN_ROLE_ID',
  'VOICE_CHANNEL_ID',
  'PLAYLIST_CHANNEL_ID'
];

const missingVars = requiredVars.filter(
  (varName) => !process.env[varName] || process.env[varName] === ''
);

if (missingVars.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes : ${missingVars.join(', ')}`
  );
}

// Configuration spécifique au bot
const botConfig = {
  NODE_ENV: env,
  DISCORD_TOKEN: getEnvVar('DISCORD_TOKEN'),
  UNSPLASH_ACCESS_KEY: getEnvVar('UNSPLASH_ACCESS_KEY'),
  STREAM_URL: getEnvVar('STREAM_URL'),
  JSON_URL: getEnvVar('JSON_URL'),
  ADMIN_ROLE_ID: getEnvVar('ADMIN_ROLE_ID'),
  VOICE_CHANNEL_ID: getEnvVar('VOICE_CHANNEL_ID'),
  PLAYLIST_CHANNEL_ID: getEnvVar('PLAYLIST_CHANNEL_ID'),
  BOT_ROLE_NAME: getEnvVar('BOT_ROLE_NAME', false, 'soundSHINE'),
  DEV_GUILD_ID: process.env.DEV_GUILD_ID,
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  API_TOKEN: process.env.API_TOKEN,
  API_PORT: process.env.API_PORT || '3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  isDev: env === 'dev',
  isProd: env === 'prod',
  roleId: process.env.SUG_ROLE_ID,
  channelId: process.env.SUG_CHANNEL_ID
};

export default botConfig;

