// commands/add_team.js
import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
const teams = JSON.parse(
  fs.readFileSync(new URL('../data/teams.json', import.meta.url))
);

export const data = new SlashCommandBuilder()
  .setName('add_team')
  .setDescription('Ajoute un utilisateur à une équipe SoundSHINE')
  .addStringOption((option) =>
    option
      .setName('team')
      .setDescription('Nom de l’équipe')
      .setRequired(true)
      .addChoices(
        ...Object.keys(teams).map((teamKey) => ({
          name: teamKey,
          value: teamKey
        }))
      )) // Correctly closing the .addStringOption method
  .addUserOption((option) =>
    option
      .setName('utilisateur')
      .setDescription('La personne à ajouter')
      .setRequired(true)); // Correctly closing the .addUserOption method

export async function execute (interaction) {
  const teamKey = interaction.options.getString('team');
  const user = interaction.options.getUser('utilisateur');
  const member = await interaction.guild.members.fetch(user.id);

  const team = teams[teamKey];

  if (!team) {
    return interaction.reply({
      content: `❌ L’équipe "${teamKey}" n’existe pas.`,
      ephemeral: true
    });
  }

  const isAuthorized = interaction.member.roles.cache.some((role) =>
    team.authorizedByRoleIds.includes(role.id));

  if (!isAuthorized) {
    return interaction.reply({
      content: '⛔ Tu n’as pas les permissions pour faire ça.',
      ephemeral: true
    });
  }

  const role = interaction.guild.roles.cache.find(
    (r) => r.name === team.roleName
  );
  if (!role) {
    return interaction.reply({
      content: `❌ Rôle "${team.roleName}" introuvable.`,
      ephemeral: true
    });
  }

  await member.roles.add(role);

  try {
    const context = {
      userTag: interaction.user.tag,
      targetTag: user.tag,
      team: teamKey,
      roleName: team.roleName,
      date: new Date().toLocaleDateString('fr-CA')
    };
    const personalizedMessage = renderTemplate(team.onboardingMessage, context);
    await user.send(personalizedMessage);
  } catch {
    // Unable to send DM to the user
  }

  return interaction.reply({
    content: `✅ ${user.tag} a été ajouté·e à l’équipe ${teamKey}.`,
    ephemeral: true
  });
}

function renderTemplate (template, context) {
  return template.replace(/{(\w+)}/g, (_, key) => context[key] ?? `{${key}}`);
}
