// ========================================
// bot/client.js (ESM)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import logger from './logger.js';

let client = null;

export function createClient () {
  if (client) {
    return client;
  }

  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
      ]
    });

    // Initialiser les collections
    client.commands = new Collection();
    client.events = new Collection();
    client.tasks = new Collection();

    logger.info('Client Discord créé avec succès');
    return client;
  } catch (error) {
    logger.error('Erreur lors de la création du client Discord:', error);
    throw error;
  }
}

export function getClient () {
  if (!client) {
    throw new Error(
      'Client Discord non initialisé. Appelez createClient() d\'abord.'
    );
  }
  return client;
}

export default client;
