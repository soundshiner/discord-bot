import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import askSubcommand from './requests.js';
import editSubcommand from './requests-edit.js';
import deleteSubcommand from './requests-delete.js';
import listSubcommand from './requests-list.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('request')
    .setDescription('Gérer les suggestions de morceaux')
    .setDMPermission(false)
    // Utilisez les builders au lieu d'accéder directement à data
    .addSubcommand(askSubcommand.builder || ((sub) => sub.setName(askSubcommand.data.name).setDescription(askSubcommand.data.description)))
    .addSubcommand(editSubcommand.builder || ((sub) => sub.setName(editSubcommand.data.name).setDescription(editSubcommand.data.description)))
    .addSubcommand(deleteSubcommand.builder || ((sub) => sub.setName(deleteSubcommand.data.name).setDescription(deleteSubcommand.data.description)))
    .addSubcommand(listSubcommand.builder || ((sub) => sub.setName(listSubcommand.data.name).setDescription(listSubcommand.data.description))),

  async execute (interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Check role permissions for all subcommands
    if (!interaction.member.roles.cache.has(config.roleId)) {
      return await interaction.reply({
        content: '❌ Tu n\'as pas l\'autorisation d\'utiliser cette commande.',
        flags: MessageFlags.Ephemeral
      });
    }

    switch (subcommand) {
    case 'ask':
      return await askSubcommand.execute(interaction);
    case 'edit':
      return await editSubcommand.execute(interaction);
    case 'delete':
      return await deleteSubcommand.execute(interaction);
    case 'list':
      return await listSubcommand.execute(interaction);
    default:
      return await interaction.reply({
        content: '❌ Sous-commande inconnue.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};