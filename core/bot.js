// core/bot.js
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import logger from '../utils/logger.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  logger.success(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

export default client;
