// commands/suggest.js
import { SlashCommandBuilder } from "discord.js";
import { db } from "../utils/database.js";
import { validateURL } from "../utils/validateURL.js";
import { genres } from "../utils/genres.js";
import config from "../core/config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Proposer un morceau pour la rotation")
    .addStringOption((option) =>
      option
        .setName("titre")
        .setDescription("Le titre du morceau")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("artiste").setDescription("L'artiste").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("lien")
        .setDescription("URL Youtube ou Spotify")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Le genre musical")
        .setRequired(false)
        .addChoices(
          ...genres.map((g, i) => ({
            name: g,
            value: g.toLowerCase().replace(/\s/g, "_"),
          }))
        )
    ),
  async execute(interaction) {
    // Check role
    if (!interaction.member.roles.cache.has(config.roleId)) {
      return interaction.reply({
        content: "❌ Tu n'as pas l'autorisation d'utiliser cette commande.",
        ephemeral: true,
      });
    }

    // Gather data
    const titre = interaction.options.getString("titre");
    const artiste = interaction.options.getString("artiste");
    const lien = interaction.options.getString("lien");
    const genre = interaction.options.getString("genre") ?? "";
    const userId = interaction.user.id;
    const username = interaction.user.tag;

    // Validate URL
    if (lien && !validateURL(lien)) {
      return interaction.reply({
        content: "❌ Ton lien n'est pas valide.",
        ephemeral: true,
      });
    }

    // Store in SQLite
    db.prepare(
      "INSERT INTO suggestions (userId, username, titre, artiste, lien, genre) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(userId, username, titre, artiste, lien, genre);

    // Send to private discord channel
    const privateChannel = interaction.client.channels.cache.get(
      config.channelId
    );
    if (privateChannel) {
      privateChannel.send(
        `🎵 **Nouvelle suggestion** \n- Titre : ${titre}\n- Artiste : ${artiste}\n- Lien : ${
          lien ?? ""
        }\n- Genre : ${genre}\n- Proposé par : ${username}`
      );
    }

    return interaction.reply({
      content:
        "✅ Ta suggestion a été prise en compte. On garde un oeil dessus !",
      ephemeral: true,
    });
  },
};
