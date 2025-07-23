// commands/suggest.js
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { database as db } from '../../utils/database/database.js';
import { validateURL } from '../../utils/bot/validateURL.js';
import { genres } from '../../utils/bot/genres.js';
import config from '../config.js';
import logger from '../logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Proposer un morceau pour la rotation')
    .addStringOption((option) =>
      option
        .setName('titre')
        .setDescription('Le titre du morceau')
        .setRequired(true))
    .addStringOption((option) =>
      option.setName('artiste').setDescription('L\'artiste').setRequired(true))
    .addStringOption((option) =>
      option
        .setName('lien')
        .setDescription('URL Youtube ou Spotify')
        .setRequired(false))
    .addStringOption((option) =>
      option
        .setName('genre')
        .setDescription('Le genre musical')
        .setRequired(false)
        .addChoices(
          ...genres.map((g) => ({
            name: g,
            value: g.toLowerCase().replace(/\s/g, '_')
          }))
        )),
  async execute (interaction) {
    try {
      // Check role
      if (!interaction.member.roles.cache.has(config.roleId)) {
        return await interaction.reply({
          content: '❌ Tu n\'as pas l\'autorisation d\'utiliser cette commande.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Gather data
      const titre = interaction.options.getString('titre');
      const artiste = interaction.options.getString('artiste');
      const lien = interaction.options.getString('lien');
      const genre = interaction.options.getString('genre') ?? '';
      const userId = interaction.user.id;
      const username = interaction.user.tag;

      // Validate URL
      if (lien && !validateURL(lien)) {
        return await interaction.reply({
          content: '❌ Ton lien n\'est pas valide.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Store in SQLite
      await db.query(
        'INSERT INTO suggestions (userId, username, titre, artiste, lien, genre) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, username, titre, artiste, lien, genre]
      );

      // Send to private discord channel
      const privateChannel = interaction.client.channels.cache.get(
        config.channelId
      );
      if (privateChannel) {
        await privateChannel.send(
          `🎵 **Nouvelle suggestion** \n- Titre : ${titre}\n- Artiste : ${artiste}\n- Lien : ${
            lien ?? ''
          }\n- Genre : ${genre}\n- Proposé par : ${username}`
        );
      }

      return await interaction.reply({
        content:
          'Ta suggestion a été prise en compte. On garde un oeil dessus !',
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      logger.error('Erreur lors de la création de la suggestion:', error);
      return await interaction.reply({
        content: '❌ Erreur lors de la création de la suggestion.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

