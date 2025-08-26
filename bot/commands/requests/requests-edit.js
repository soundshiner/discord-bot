import { MessageFlags } from 'discord.js';
import { database as db } from '../../../utils/database/database.js';
import logger from '../../logger.js';

export default {
  builder: (subcommand) =>
    subcommand
      .setName('edit')
      .setDescription('Éditer une suggestion.')
      .addIntegerOption((option) =>
        option
          .setName('id')
          .setDescription('ID de la suggestion')
          .setRequired(true))
      .addStringOption((option) =>
        option
          .setName('titre')
          .setDescription('Nouveau titre')
          .setRequired(false))
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

    // Check if at least one field is provided for update
    if (!newTitre && !newArtiste) {
      return interaction.reply({
        content:
          '❌ Vous devez fournir au moins un champ à modifier (titre ou artiste).',
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

      // Build update query dynamically based on provided fields
      let updateQuery = 'UPDATE suggestions SET ';
      const updateValues = [];
      const updateFields = [];

      if (newTitre && newTitre.trim() !== '') {
        updateQuery += 'titre = ?';
        updateValues.push(newTitre.trim());
        updateFields.push(`titre: ${newTitre.trim()}`);
      }

      if (newArtiste && newArtiste.trim() !== '') {
        if (updateValues.length > 0) updateQuery += ', ';
        updateQuery += 'artiste = ?';
        updateValues.push(newArtiste.trim());
        updateFields.push(`artiste: ${newArtiste.trim()}`);
      }

      updateQuery += ' WHERE id = ?';
      updateValues.push(suggestionId);

      await db.query(updateQuery, updateValues);

      return await interaction.reply(
        `Suggestion modifiée avec succès. Champs mis à jour: ${updateFields.join(
          ', '
        )}`
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

