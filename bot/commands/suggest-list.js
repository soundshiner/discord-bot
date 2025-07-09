// commands/list_suggestions.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { db } from "../../bot/utils/database.js";
import config from "../config.js";
import logger from "../logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list_suggestions")
    .setDescription("Voir toutes les suggestions de morceaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    try {
      // Check role
      if (!interaction.member.roles.cache.has(config.roleId)) {
        return await interaction.reply({
          content: "❌ Tu n'as pas l'autorisation d'utiliser cette commande.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Retrieve from SQLite
      const suggestions = await db.query(
        "SELECT * FROM suggestions ORDER BY createdAt DESC LIMIT 20"
      );

      if (suggestions.length === 0) {
        return await interaction.reply({
          content: "🎵 Aucune suggestion.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Format the list
      const msg = suggestions
        .map(
          (s) =>
            `**${s.id}.** ${s.titre} - ${s.artiste} [${s.genre}] (Proposé par ${
              s.username
            })${s.lien ? `\nLien : ${s.lien}` : ""}`
        )
        .join("\n\n");

      // Reply with the list (ephemeral)
      return await interaction.reply({
        content: msg.slice(0, 2000),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      logger.error("Erreur lors de la récupération des suggestions:", error);
      return await interaction.reply({
        content: "❌ Erreur lors de la récupération des suggestions.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

