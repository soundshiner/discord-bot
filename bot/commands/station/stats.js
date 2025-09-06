import {
  SlashCommandSubcommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import axios from 'axios';
import config from '../../config.js';
import logger from '../../logger.js';

const { ADMIN_ROLE_ID, JSON_URL } = config;

const builder = (subcommand) =>
  subcommand
    .setName('stats')
    .setDescription('Affiche les statistiques du stream');

async function execute (interaction) {
  if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
    return interaction.reply({
      content: 'Cette commande est réservée aux administrateurs.',
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    const { data } = await axios.get(JSON_URL);
    const listeners = data.icestats?.source?.listeners ?? 'N/A';
    const bitrate = data.icestats?.source?.bitrate ?? 'N/A';

    const statsMessage = `**📊 Stream Stats**\n👥 Auditeurs : ${listeners}\n🔊 Bitrate : ${bitrate} kbps`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('show_full_stats')
        .setLabel('Stats complètes Icecast')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: statsMessage, components: [row] });
  } catch (err) {
    logger.error('Erreur récupération stats:', err);
    return await interaction.reply(
      '❌ Impossible de récupérer les stats du stream.'
    );
  }
}

export default { builder, execute };

