import { MessageFlags } from 'discord.js';
import axios from 'axios';
import config from '../../config.js';
import logger from '../../logger.js';

const { JSON_URL } = config;

export default {
  builder: (subcommand) =>
    subcommand
      .setName('nowplaying')
      .setDescription('Affiche la chanson en cours de lecture'),

  async execute (interaction) {
    try {
      const response = await axios.get(JSON_URL);
      const { data } = response;
      const currentSong
        = data?.icestats?.source?.title || 'Aucune chanson en cours.';

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
