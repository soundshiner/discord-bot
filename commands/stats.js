import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import axios from 'axios';
import config from '../core/config.js';
import logger from '../utils/logger.js';

const { ADMIN_ROLE_ID, JSON_URL } = config;

const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Affiche les statistiques du stream')
  .setDefaultMemberPermissions(0); // Pas de perms par défaut

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

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15_000
    });

    collector.on('collect', async i => {
      if (i.customId === 'show_full_stats') {
        try {
          await i.update({
            content: `📊 **Stats complètes Icecast**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
            components: []
          });
        } catch (err) {
          logger.error('Erreur stats complètes:', err);
          await i.update({
            content: '❌ Impossible de récupérer les stats complètes.',
            components: []
          });
        }
      }
    });
  } catch (err) {
    logger.error('Erreur récupération stats:', err);
    return await interaction.reply('❌ Impossible de récupérer les stats du stream.');
  }
}

export default { data, execute };
