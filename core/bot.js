// ========================================
// core/bot.js (ESM)
// ========================================

import { Client, GatewayIntentBits, Collection } from 'discord.js';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

export default client;
