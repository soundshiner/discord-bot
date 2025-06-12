import { SlashCommandBuilder } from "discord.js";
import axios from "axios";
import config from "../core/config.js";
import logger from "../utils/logger.js";

const { JSON_URL } = config;

export default {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("🎵 Affiche la chanson en cours de lecture")
    .setDMPermission(false),
  async execute(interaction) {
    try {
      const response = await axios.get(JSON_URL);
      const data = response.data;
      const currentSong =
        data?.icestats?.source?.title || "Aucune chanson en cours.";

      await interaction.reply(`🎶 Now playing: **${currentSong}**`);
    } catch (error) {
      logger.error(`Erreur récupération chanson en cours : ${error.message}`);
      await interaction.reply(
        "❌ Impossible de récupérer la chanson actuelle."
      );
    }
  },
};
