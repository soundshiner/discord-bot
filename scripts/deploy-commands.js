import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { REST, Routes } from 'discord.js';
import config from '../core/config.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isDev = args.includes('--dev');

const isGlobal = args.includes('--global');

if (!isDev && !isGlobal) {
  logger.error('❌ Spécifie --dev ou --global pour déployer les commandes.');
  process.exit(1);
}

const commands = [];

const commandsPath = path.join(__dirname, '..', 'commands');

const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

try {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileURL = pathToFileURL(filePath).href;
    const command = (await import(fileURL)).default;

    if ('data' in command && 'execute' in command) {
      // Renomme si DEV
      if (isDev) {
        command.data.setName(`dev-${command.data.name}`);
      }
      commands.push(command.data.toJSON());
    } else {
      logger.warn(`⚠️ La commande ${file} est incomplète (data/execute manquant).`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);

  logger.info(`🔄 Déploiement de ${commands.length} commandes ${isDev ? 'en mode DEV' : 'GLOBAL'}...`);

  const route = isDev
    ? Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_GUILD_ID)
    : Routes.applicationCommands(config.CLIENT_ID);

  await rest.put(route, { body: commands });

  logger.info('✅ Commandes déployées avec succès.');
} catch (error) {
  logger.error('❌ Erreur pendant le déploiement :', error);
  process.exit(1);
}
