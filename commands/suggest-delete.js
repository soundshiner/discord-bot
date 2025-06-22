// commands/suggest-delete.js
import { SlashCommandBuilder } from "discord.js";
// import db depuis ton gestionnaire SQLite
import { db } from "../utils/database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("suggest-delete")
    .setDescription("Supprimer une suggestion.")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("ID de la suggestion")
        .setRequired(true)
    ),
  async execute(interaction) {
    const id = interaction.options.getInteger("id");

    const suggestion = db
      .prepare("SELECT * FROM suggestions WHERE id = ?")
      .get(id);

    if (!suggestion) {
      return interaction.reply({
        content: "❌ Suggestion non-trouvée.",
        ephemeral: true,
      });
    }

    db.prepare("DELETE FROM suggestions WHERE id = ?").run(id);

    interaction.reply({ content: "✅ Suggestion supprimée!" });
  },
};
