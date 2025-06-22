// commands/suggest-edit.js
import { SlashCommandBuilder } from "discord.js";
// import db depuis ton gestionnaire SQLite
import { db } from "../utils/database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("suggest-edit")
    .setDescription("Éditer une suggestion.")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("ID de la suggestion")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("titre").setDescription("Nouveau titre").setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("artiste")
        .setDescription("Nouvel artiste")
        .setRequired(false)
    ),
  async execute(interaction) {
    const id = interaction.options.getInteger("id");

    // Récupère d'abord l'enregistrement
    const suggestion = db
      .prepare("SELECT * FROM suggestions WHERE id = ?")
      .get(id);

    if (!suggestion) {
      return interaction.reply({
        content: "❌ Suggestion non-trouvée.",
        ephemeral: true,
      });
    }

    // Met à jours
    const newTitle = interaction.options.getString("title") ?? suggestion.title;
    const newArtist =
      interaction.options.getString("artist") ?? suggestion.artist;

    db.prepare(
      "UPDATE suggestions SET titre = ?, artiste = ? WHERE id = ?"
    ).run(newTitle, newArtist, id);

    interaction.reply({ content: "✅ Suggestion modifiée avec succès!" });
  },
};
