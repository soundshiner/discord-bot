// commands/suggest-delete.js
import { SlashCommandBuilder, MessageFlags } from 'discord.js';
// import db depuis ton gestionnaire SQLite
import { db } from '../utils/database.js';
import logger from '../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggest-delete')
    .setDescription('Supprimer une suggestion.')
    .addIntegerOption(option => option.setName('id').setDescription('ID de la suggestion').setRequired(true)),
  async execute (interaction) {
    const suggestionId = interaction.options.getInteger('id');

    if (!suggestionId) {
      return interaction.reply({
        content: '❌ ID de suggestion invalide.',
        flags: MessageFlags.Ephemeral
      });
    }

    try {
      const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ?').get(suggestionId);

      if (!suggestion) {
        return interaction.reply({
          content: '❌ Suggestion introuvable.',
          flags: MessageFlags.Ephemeral
        });
      }

      db.prepare('DELETE FROM suggestions WHERE id = ?').run(suggestionId);

      return await interaction.reply(`✅ Suggestion **${suggestion.titre}** supprimée avec succès.`);
    } catch (error) {
      logger.error('Erreur suppression suggestion:', error);
      return await interaction.reply({
        content: '❌ Erreur lors de la suppression de la suggestion.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
