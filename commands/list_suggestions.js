// commands/list_suggestions.js
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "../utils/database.js";
import config from "../core/config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("list_suggestions")
    .setDescription("Voir toutes les suggestions de morceaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    // Check role
    if (!interaction.member.roles.cache.has(config.roleId)) {
      return interaction.reply({
        content: "❌ Tu n'as pas l'autorisation d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    // Retrieve from SQLite
    const suggestions = db
      .prepare("SELECT * FROM suggestions ORDER BY createdAt DESC LIMIT 20")
      .all();

    if (suggestions.length === 0) {
      return interaction.reply({
        content: "🎵 Aucune suggestion.",
        ephemeral: true,
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
    return interaction.reply({ content: msg.slice(0, 2000), ephemeral: true });
  },
};
