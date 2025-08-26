import { SlashCommandBuilder } from 'discord.js';
import playSubcommand from './play.js';
import stopSubcommand from './stop.js';
import nowplayingSubcommand from './nowplaying.js';
import config from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Commandes pour contrôler la radio')
    .setDMPermission(false)
    .addSubcommand(playSubcommand.builder || playSubcommand.data)
    .addSubcommand(stopSubcommand.builder || stopSubcommand.data)
    .addSubcommand(nowplayingSubcommand.builder || nowplayingSubcommand.data),

  async execute (interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Check admin permissions for stop command
    if (
      subcommand === 'stop'
      && !interaction.member.roles.cache.has(config.ADMIN_ROLE_ID)
    ) {
      return await interaction.reply({
        content: '❌ Cette commande est réservée aux administrateurs.',
        ephemeral: true
      });
    }

    switch (subcommand) {
    case 'play':
      return await playSubcommand.execute(interaction);
    case 'stop':
      return await stopSubcommand.execute(interaction);
    case 'nowplaying':
      return await nowplayingSubcommand.execute(interaction);
    default:
      return await interaction.reply({
        content: '❌ Sous-commande inconnue.',
        ephemeral: true
      });
    }
  }
};

