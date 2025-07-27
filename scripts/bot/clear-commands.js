// clear-commands.js
import { REST, Routes } from 'discord.js';
import config from '../../bot/config.js';
import logger from '../../bot/logger.js';

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

const isDev = process.argv.slice(2).includes('--dev');

const route = isDev
  ? Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_GUILD_ID)
  : Routes.applicationCommands(config.CLIENT_ID);

async function clearCommands () {
  try {
    logger.info(`🏹 Suppression des commandes ${isDev ? 'DEV' : 'GLOBAL'}...`);

    // Récupère toutes les commandes
    const commands = await rest.get(route);

    for (const cmd of commands) {
      // garde l'Entry Point Command
      if (cmd.id === config.ENTRY_POINT_COMMAND_ID) {
        logger.info(`⚡ Commande d'entrée non-supprimée : ${cmd.name}.`);
        continue;
      }

      logger.info(`❌ Suppression de ${cmd.name} (${cmd.id})...`);

      await rest.delete(
        isDev
          ? Routes.applicationGuildCommand(
            config.CLIENT_ID,
            config.DEV_GUILD_ID,
            cmd.id
          )
          : Routes.applicationCommand(config.CLIENT_ID, cmd.id)
      );
    }

    logger.info('✅ Commandes toutes supprimées.');
  } catch (error) {
    logger.error('❌ Erreur pendant la suppression :', error);
    process.exit(1);
  }
}

clearCommands();

