import { getVoiceConnection } from '@discordjs/voice';
import logger from '../../logger.js';
import stageMonitor from '../../../core/services/StageMonitor.js';

const builder = (subcommand) =>
  subcommand
    .setName('stop')
    .setDescription('Arrête le stream et déconnecte le bot du salon vocal');

async function execute (interaction) {
  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    return await interaction.reply('❌ Le bot n\'est pas connecté à un salon vocal.');
  }

  try {
    // 🎭 Désenregistrer le stage de la surveillance avant déconnexion
    stageMonitor.unregisterStage(interaction.guild.id);

    connection.destroy();
    logger.info(`Bot déconnecté du vocal sur ${interaction.guild.name}`);
    return await interaction.reply('🛑 Stream arrêté, bot déconnecté du vocal.');
  } catch (error) {
    logger.error(`Erreur dans stop: ${error.message}`);
    return await interaction.reply('❌ Erreur lors de l\'arrêt du stream.');
  }
}

export default { builder, execute };
