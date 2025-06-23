import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import axios from 'axios';
import config from '../core/config.js';
import { logger } from '../utils/logger.js';

const { JSON_URL } = config;

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('🎵 Affiche la chanson en cours de lecture')
    .setDMPermission(false),
  async execute(interaction) {
    try {
      const response = await axios.get(JSON_URL);
      const { data } = response;
      const currentSong = data?.icestats?.source?.title || 'Aucune chanson en cours.';

      return await interaction.reply(`🎶 Now playing: **${currentSong}**`);
    } catch (error) {
      logger.error(`Erreur récupération chanson en cours : ${error.message}`);
      return await interaction.reply({
        content: '❌ Impossible de récupérer la chanson actuelle.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
