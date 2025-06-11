import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import config from "../core/config.js";
import logger from "../utils/logger.js";

const { ADMIN_ROLE_ID, JSON_URL, ICECAST_HISTORY_URL } = config;

export default {
  name: "stats",
  description: "Affiche les statistiques du stream",
  async execute(message, args) {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.reply(
        "Vous devez être administrateur pour exécuter cette commande."
      );
    }

    try {
      const { data } = await axios.get(JSON_URL);
      const listeners = data.icestats?.source?.listeners ?? "N/A";
      const bitrate = data.icestats?.source?.bitrate ?? "N/A";

      const statsMessage = `**Stream Stats**:\nCurrent listeners: ${listeners}\nBitrate: ${bitrate} kbps`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("show_history")
          .setLabel("Historique des chansons (5)")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("show_full_stats")
          .setLabel("Stats complètes Icecast")
          .setStyle(ButtonStyle.Secondary)
      );

      await message.reply({
        content: statsMessage,
        components: [row],
      });

      const collector = message.channel.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === message.author.id,
        time: 15_000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "show_history") {
          try {
            const historyData = await axios.get(ICECAST_HISTORY_URL);
            const history = historyData.data.history.slice(0, 5);
            const songList = history
              .map((song, i) => `${i + 1}. **${song.song}** - ${song.artist}`)
              .join("\n");

            await interaction.update({
              content: `**Historique des 5 dernières chansons jouées**:\n${songList}`,
              components: [],
            });
          } catch (error) {
            logger.error("Erreur récupération historique chansons:", error);
            await interaction.update({
              content: "Impossible de récupérer l'historique des chansons.",
              components: [],
            });
          }
        } else if (interaction.customId === "show_full_stats") {
          try {
            const fullStats = JSON.stringify(data, null, 2);
            await interaction.update({
              content: `**Statistiques complètes du stream Icecast** :\n\`\`\`json\n${fullStats}\n\`\`\``,
              components: [],
            });
          } catch (error) {
            logger.error("Erreur récupération stats complètes:", error);
            await interaction.update({
              content:
                "Impossible de récupérer les statistiques complètes du stream.",
              components: [],
            });
          }
        }
      });
    } catch (error) {
      logger.error("Error fetching stream stats:", error);
      message.reply("Impossible de récupérer les statistiques du stream.");
    }
  },
};
