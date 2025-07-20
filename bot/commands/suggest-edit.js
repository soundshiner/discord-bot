// commands/suggest-edit.js
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
// import db depuis ton gestionnaire SQLite
import { database as db } from '../../utils/database/database.js';
import logger from '../logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggest-edit')
    .setDescription('Éditer une suggestion.')
    .addIntegerOption((option) =>
      option
        .setName('id')
        .setDescription('ID de la suggestion')
        .setRequired(true))
    .addStringOption((option) =>
      option.setName('titre').setDescription('Nouveau titre').setRequired(false))
    .addStringOption((option) =>
      option
        .setName('artiste')
        .setDescription('Nouvel artiste')
        .setRequired(false)),
  async execute (interaction) {
    const suggestionId = interaction.options.getInteger('id');
    const newTitre = interaction.options.getString('titre');
    const newArtiste = interaction.options.getString('artiste');

    if (!suggestionId) {
      return interaction.reply({
        content: '❌ ID de suggestion invalide.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const [suggestion] = await db.query(
        'SELECT * FROM suggestions WHERE id = ?',
        [suggestionId]
      );

      if (!suggestion) {
        return interaction.reply({
          content: '❌ Suggestion introuvable.',
          flags: MessageFlags.Ephemeral
        });
      }

      await db.query(
        'UPDATE suggestions SET titre = ?, artiste = ? WHERE id = ?',
        [newTitre, newArtiste, suggestionId]
      );

      return await interaction.reply(
        `✅ Suggestion **${newTitre}** modifiée avec succès.`
      );
    } catch (error) {
      logger.error('Erreur modification suggestion:', error);
      return await interaction.reply({
        content: '❌ Erreur lors de la modification de la suggestion.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

