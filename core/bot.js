// ========================================
// core/bot.js (ESM)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';
import config from './config.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();
client.config = { PREFIX: config.PREFIX };

export default client;
