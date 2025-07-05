import { MessageFlags } from 'discord.js';
import handlePlaylistSelect from '../handlers/handlePlaylistSelect.js'; // on importe ton handler
import logger from '../logger.js';
import monitor from '../../core/monitor.js';

export default {
  name: 'interactionCreate',
  async execute (interaction) {
    try {
      if (interaction.isCommand()) {
        const command = interaction.client.commands.get(
          interaction.commandName
        );
        if (!command) {
          return;
        }

        try {
          await command.execute(interaction);
        } catch (error) {
          monitor.handleCommandError(error, interaction);
          logger.error(`❌ Erreur commande ${interaction.commandName}:`, error);
          if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
              content:
                '❌ Une erreur est survenue pendant l\'exécution de la commande.'
            });
          } else {
            await interaction.reply({
              content:
                '❌ Une erreur est survenue pendant l\'exécution de la commande.',
              flags: MessageFlags.Ephemeral
            });
          }
        }
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_playlist') {
          try {
            await handlePlaylistSelect(interaction);
          } catch (error) {
            monitor.handleCommandError(error, interaction);
            logger.error('Erreur dans handlePlaylistSelect:', error);
            if (interaction.replied || interaction.deferred) {
              await interaction.editReply({
                content:
                  '❌ Une erreur est survenue lors du lancement de la playlist.'
              });
            } else {
              await interaction.reply({
                content:
                  '❌ Une erreur est survenue lors du lancement de la playlist.',
                flags: MessageFlags.Ephemeral
              });
            }
          }
        }
      }
    } catch (error) {
      monitor.handleCriticalError(error, 'INTERACTION_CREATE');
      logger.error('Erreur générale dans interactionCreate:', error);
    }
  }
};
