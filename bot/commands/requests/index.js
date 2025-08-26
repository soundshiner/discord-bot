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
    .addSubcommand(askSubcommand.builder)
    .addSubcommand(editSubcommand.builder)
    .addSubcommand(deleteSubcommand.builder)
    .addSubcommand(listSubcommand.builder),

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
