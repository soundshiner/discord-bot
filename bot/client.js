// ========================================
// bot/client.js (ESM) - Client Discord optimisé
// ========================================

import { Client, GatewayIntentBits, Collection } from "discord.js";
import logger from "./logger.js";

class DiscordClient {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  createClient() {
    if (this.client && this.isInitialized) {
      logger.warn("Client Discord déjà initialisé, retour du client existant");
      return this.client;
    }

    try {
      // Validation des intents requis
      const requiredIntents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ];

      this.client = new Client({
        intents: requiredIntents,
        // Optimisations de performance
        ws: {
          properties: {
            browser: "Discord iOS",
          },
        },
        // Gestion des timeouts
        rest: {
          timeout: 15000,
          retries: 3,
        },
      });

      // Initialiser les collections avec validation
      this.client.commands = new Collection();
      this.client.events = new Collection();
      this.client.tasks = new Collection();

      // Validation de l'initialisation
      if (!this.client.commands || !this.client.events || !this.client.tasks) {
        throw new Error("Échec de l'initialisation des collections Discord");
      }

      this.isInitialized = true;
      logger.success("Client Discord créé avec succès");
      return this.client;
    } catch (error) {
      logger.error(
        "Erreur critique lors de la création du client Discord:",
        error
      );
      this.isInitialized = false;
      throw new Error(
        `Échec de l'initialisation du client Discord: ${error.message}`
      );
    }
  }

  getClient() {
    if (!this.client || !this.isInitialized) {
      throw new Error(
        "Client Discord non initialisé ou invalide. Appelez createClient() d'abord."
      );
    }
    return this.client;
  }

  destroy() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.isInitialized = false;
      logger.info("Client Discord détruit");
    }
  }

  isReady() {
    return this.client && this.client.isReady();
  }
}

// Instance singleton
const discordClient = new DiscordClient();

export function createClient() {
  return discordClient.createClient();
}

export function getClient() {
  return discordClient.getClient();
}

export function destroyClient() {
  return discordClient.destroy();
}

export function isClientReady() {
  return discordClient.isReady();
}

export default discordClient;

