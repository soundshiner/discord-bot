import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import config from '../core/config.js';
import { logger } from '../utils/logger.js';

const { ADMIN_ROLE_ID } = config;

const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Arrête le stream et déconnecte le bot du salon vocal')
  .setDefaultMemberPermissions(0); // Perms custom

async function execute (interaction) {
  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    return await interaction.reply({
      content: '❌ Cette commande est réservée aux administrateurs.',
      flags: MessageFlags.Ephemeral
    });
  }

  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    return await interaction.reply('❌ Le bot n\'est pas connecté à un salon vocal.');
  }

  try {
    connection.destroy();
    logger.info(`Bot déconnecté du vocal sur ${interaction.guild.name}`);
    return await interaction.reply('🛑 Stream arrêté, bot déconnecté du vocal.');
  } catch (error) {
    logger.error(`Erreur dans stop: ${error.message}`);
    return await interaction.reply('❌ Erreur lors de l\'arrêt du stream.');
  }
}

export default { data, execute };
