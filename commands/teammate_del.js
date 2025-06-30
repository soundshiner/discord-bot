import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
const teams = JSON.parse(
  fs.readFileSync(new URL("../data/teams.json", import.meta.url))
);

// Removed unused renderTemplate function

export const data = new SlashCommandBuilder()
  .setName("del_teammate")
  .setDescription("Retire un utilisateur d'une équipe SoundSHINE")
  .addStringOption((option) =>
    option
      .setName("team")
      .setDescription("Nom de l'équipe")
      .setRequired(true)
      .addChoices(
        ...Object.keys(teams).map((teamKey) => ({
          name: teamKey,
          value: teamKey,
        }))
      )
  )
  .addUserOption((option) =>
    option
      .setName("utilisateur")
      .setDescription("La personne à retirer")
      .setRequired(true)
  );

export default {
  data,
  async execute(interaction) {
    const teamKey = interaction.options.getString("team");
    const user = interaction.options.getUser("utilisateur");
    const member = await interaction.guild.members.fetch(user.id);

    const team = teams[teamKey];
    if (!team) {
      return interaction.reply({
        content: `❌ L'équipe "${teamKey}" n'existe pas.`,
        ephemeral: true,
      });
    }

    // Check permission de l'auteur
    const isAuthorized = interaction.member.roles.cache.some((role) =>
      team.authorizedByRoleIds.includes(role.id)
    );
    if (!isAuthorized) {
      return interaction.reply({
        content: "⛔ Tu n'as pas les permissions pour faire ça.",
        ephemeral: true,
      });
    }

    const role = interaction.guild.roles.cache.find(
      (r) => r.name === team.roleName
    );
    if (!role) {
      return interaction.reply({
        content: `❌ Rôle "${team.roleName}" introuvable.`,
        ephemeral: true,
      });
    }

    // Retirer le rôle
    await member.roles.remove(role);

    // Message DM possible — ici un texte simple.
    const dmMessage =
      `👋 Tu as été retiré·e de l'équipe *${teamKey}* de SoundSHINE. ` +
      "Si c'est une erreur, contacte un·e admin.";

    try {
      await user.send(dmMessage);
    } catch {
      interaction.client.emit(
        "warn",
        "⚠️ Impossible d'envoyer le DM à l'utilisateur."
      );
      interaction.client.emit(
        "warn",
        "⚠️ Impossible d'envoyer le DM à l'utilisateur."
      );
    }

    return interaction.reply({
      content: `✅ ${user.tag} a été retiré·e de l'équipe ${teamKey}.`,
      ephemeral: true,
    });
  },
};
