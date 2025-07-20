// ========================================
// bot/utils/globalConfig.js - Configuration globale avec validation
// ========================================

import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import logger from "../../bot/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Schéma de validation des variables d'environnement
const envSchema = z.object({
  // Variables Discord
  DISCORD_TOKEN: z.string().min(50, "Token Discord invalide"),
  CLIENT_ID: z.string().optional(),
  GUILD_ID: z.string().optional(),
  DEV_GUILD_ID: z.string().optional(),

  // Variables API
  UNSPLASH_ACCESS_KEY: z.string().min(20, "Clé Unsplash invalide"),
  STREAM_URL: z.string().url("URL de stream invalide"),
  JSON_URL: z.string().url("URL JSON invalide"),

  // Variables de rôles et canaux
  ADMIN_ROLE_ID: z.string().regex(/^\d{17,20}$/, "ID de rôle admin invalide"),
  VOICE_CHANNEL_ID: z
    .string()
    .regex(/^\d{17,20}$/, "ID de canal vocal invalide"),
  PLAYLIST_CHANNEL_ID: z
    .string()
    .regex(/^\d{17,20}$/, "ID de canal playlist invalide"),

  // Variables de configuration
  NODE_ENV: z
    .enum(["dev", "development", "staging", "prod", "production"])
    .transform((val) => {
      // Normaliser les valeurs d'environnement
      if (val === "development") return "dev";
      if (val === "production") return "prod";
      return val;
    })
    .default("dev"),
  API_PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),
  API_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  BOT_ROLE_NAME: z.string().default("soundSHINE"),

  // Variables de base de données
  DB_PATH: z.string().optional(),

  // Variables de sécurité
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("900000"),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default("100"),

  // Variables de monitoring
  ENABLE_METRICS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_HEALTH_CHECK: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // Variables de cache
  CACHE_TTL: z.string().regex(/^\d+$/).transform(Number).default("300000"),
  CACHE_MAX_SIZE: z.string().regex(/^\d+$/).transform(Number).default("1000"),

  // Variables du détecteur de silence
  SILENCE_THRESHOLD: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("5000"),
  SILENCE_CHECK_INTERVAL: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("10000"),
  SILENCE_ALERTS_ENABLED: z
    .string()
    .transform((val) => val !== "false")
    .default("true"),
  SILENCE_ALERT_CHANNEL_ID: z.string().optional(),
  ADMIN_USER_ID: z.string().optional(),
});

// Fonction de chargement des variables d'environnement
function loadEnvironmentVariables() {
  const env = process.env.NODE_ENV || "dev";

  // Chemins des fichiers .env
  const baseEnvPath = path.join(__dirname, "../../.env");
  const envSpecificPath = path.join(__dirname, `../../.env.${env}`);

  // Charger les fichiers .env
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
    logger.debug("Fichier .env de base chargé");
  }

  if (fs.existsSync(envSpecificPath)) {
    dotenv.config({ path: envSpecificPath });
    logger.debug(`Fichier .env.${env} chargé`);
  }

  // Charger depuis process.env
  dotenv.config();
}

// Fonction de validation et transformation
function validateAndTransformConfig() {
  try {
    // Charger les variables d'environnement
    loadEnvironmentVariables();

    // Valider avec le schéma
    const validatedEnv = envSchema.parse(process.env);

    // Configuration enrichie
    const config = {
      ...validatedEnv,

      // Propriétés calculées
      isDev: validatedEnv.NODE_ENV === "dev",
      isStaging: validatedEnv.NODE_ENV === "staging",
      isProd: validatedEnv.NODE_ENV === "prod",

      // Chemins de fichiers
      dbPath:
        validatedEnv.DB_PATH ||
        path.join(__dirname, "../../databases/soundshine.sqlite"),
      logsPath: path.join(__dirname, "../../logs"),

      // Configuration de sécurité
      security: {
        corsOrigin: validatedEnv.CORS_ORIGIN || "*",
        rateLimit: {
          windowMs: validatedEnv.RATE_LIMIT_WINDOW,
          max: validatedEnv.RATE_LIMIT_MAX,
        },
      },

      // Configuration de cache
      cache: {
        ttl: validatedEnv.CACHE_TTL,
        maxSize: validatedEnv.CACHE_MAX_SIZE,
      },

      // Configuration de monitoring
      monitoring: {
        enableMetrics: validatedEnv.ENABLE_METRICS,
        enableHealthCheck: validatedEnv.ENABLE_HEALTH_CHECK,
      },

      // Configuration Discord
      discord: {
        token: validatedEnv.DISCORD_TOKEN,
        clientId: validatedEnv.CLIENT_ID,
        guildId: validatedEnv.GUILD_ID,
        devGuildId: validatedEnv.DEV_GUILD_ID,
        adminRoleId: validatedEnv.ADMIN_ROLE_ID,
        voiceChannelId: validatedEnv.VOICE_CHANNEL_ID,
        playlistChannelId: validatedEnv.PLAYLIST_CHANNEL_ID,
        botRoleName: validatedEnv.BOT_ROLE_NAME,
      },

      // Configuration API
      api: {
        port: validatedEnv.API_PORT,
        token: validatedEnv.API_TOKEN,
        unsplashKey: validatedEnv.UNSPLASH_ACCESS_KEY,
        streamUrl: validatedEnv.STREAM_URL,
        jsonUrl: validatedEnv.JSON_URL,
      },
    };

    logger.success("Configuration validée avec succès");
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        received: err.received,
      }));

      logger.error("Variables d'environnement manquantes ou invalides:");
      missingVars.forEach(({ field, message, received }) => {
        logger.error(`  - ${field}: ${message} (reçu: ${received})`);
      });

      throw new Error(
        `Configuration invalide: ${missingVars.length} erreur(s) de validation`
      );
    }

    logger.error("Erreur lors du chargement de la configuration:", error);
    throw error;
  }
}

// Cache de la configuration
let configCache = null;

// Fonction principale d'export
export function getGlobalConfig() {
  if (configCache) {
    return configCache;
  }

  configCache = validateAndTransformConfig();
  return configCache;
}

// Fonction de réinitialisation (utile pour les tests)
export function resetConfig() {
  configCache = null;
}

// Fonction de validation d'une variable spécifique
export function validateConfigVar(varName, value) {
  try {
    const partialSchema = z.object({ [varName]: envSchema.shape[varName] });
    partialSchema.parse({ [varName]: value });
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.errors[0]?.message || "Validation échouée",
    };
  }
}

// Fonction de vérification de la configuration
export function checkConfigHealth() {
  try {
    const config = getGlobalConfig();
    const checks = {
      discord: {
        token: !!config.discord.token,
        adminRole: !!config.discord.adminRoleId,
        voiceChannel: !!config.discord.voiceChannelId,
      },
      api: {
        port: config.api.port > 0 && config.api.port < 65536,
        unsplashKey: !!config.api.unsplashKey,
        streamUrl: !!config.api.streamUrl,
      },
      database: {
        path: !!config.dbPath,
      },
    };

    const allChecks = Object.values(checks).flatMap(Object.values);
    const isHealthy = allChecks.every((check) => check === true);

    return {
      healthy: isHealthy,
      checks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export par défaut pour compatibilité
export default getGlobalConfig;

