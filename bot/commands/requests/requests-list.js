import { MessageFlags } from 'discord.js';
import { database as db } from '../../../utils/database/database.js';
import logger from '../../logger.js';

export default {
  builder: (subcommand) =>
    subcommand
      .setName('list')
      .setDescription('Voir toutes les suggestions de morceaux'),

  async execute (interaction) {
    try {
      // Retrieve from SQLite
      const suggestions = await db.query(
        'SELECT * FROM suggestions ORDER BY createdAt DESC LIMIT 20'
      );

      if (suggestions.length === 0) {
        return await interaction.reply({
          content: '🎵 Aucune suggestion.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Format the list
      const msg = suggestions
        .map(
          (s) =>
            `**${s.id}.** ${s.titre} - ${s.artiste} [${s.genre}] (Proposé par ${
              s.username
            })${s.lien ? `\nLien : ${s.lien}` : ''}`
        )
        .join('\n\n');

      // Reply with the list (ephemeral)
      return await interaction.reply({
        content: msg.slice(0, 2000),
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des suggestions:', error);
      return await interaction.reply({
        content: '❌ Erreur lors de la récupération des suggestions.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

