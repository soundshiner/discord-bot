// ========================================
// core/config.js (version ESM modernisée)
// ========================================
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

// Obtenir __dirname façon ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Déterminer l'environnement
const env = process.env.NODE_ENV || "dev";

// Charger les .env commun + spécifique
const baseEnvPath = path.join(__dirname, "../.env");
const envSpecificPath = path.join(__dirname, `../.env.${env}`);

if (fs.existsSync(baseEnvPath)) dotenv.config({ path: baseEnvPath });
if (fs.existsSync(envSpecificPath)) dotenv.config({ path: envSpecificPath });

// Fonction utilitaire
function getEnvVar(name, required = true, defaultValue = undefined) {
  const value = process.env[name] ?? defaultValue;
  if (required && (value === undefined || value === "")) {
    throw new Error(
      `La variable d'environnement ${name} est obligatoire mais non définie.`
    );
  }
  return value;
}

// Validation
const requiredVars = [
  "BOT_TOKEN",
  "UNSPLASH_ACCESS_KEY",
  "STREAM_URL",
  "JSON_URL",
  "ADMIN_ROLE_ID",
  "VOICE_CHANNEL_ID",
  "PLAYLIST_CHANNEL_ID",
];

const missingVars = requiredVars.filter(
  (varName) => !process.env[varName] || process.env[varName] === ""
);

if (missingVars.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes : ${missingVars.join(", ")}`
  );
}

// Config finale exportée
const config = {
  NODE_ENV: env,
  BOT_TOKEN: getEnvVar("BOT_TOKEN"),
  UNSPLASH_ACCESS_KEY: getEnvVar("UNSPLASH_ACCESS_KEY"),
  STREAM_URL: getEnvVar("STREAM_URL"),
  JSON_URL: getEnvVar("JSON_URL"),
  ICECAST_HISTORY_URL: getEnvVar("ICECAST_HISTORY_URL"),
  ADMIN_ROLE_ID: getEnvVar("ADMIN_ROLE_ID"),

  WEBHOOK_API_TOKEN: getEnvVar("WEBHOOK_API_TOKEN"),
  WEBPORT: Number(getEnvVar("WEBPORT", false, 3000)),

  PREFIX: getEnvVar("PREFIX", false, "!s"),
  VOICE_CHANNEL_ID: getEnvVar("VOICE_CHANNEL_ID"),
  ANNOUNCEMENTS_CHANNEL_ID: getEnvVar("PLAYLIST_CHANNEL_ID"),
  BOT_ROLE_NAME: getEnvVar("BOT_ROLE_NAME", false, "soundSHINE"),

  isDev: env === "dev",
  isProd: env === "prod",
};

export default config;
