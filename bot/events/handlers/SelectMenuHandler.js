// ========================================
// bot/events/handlers/SelectMenuHandler.js - Gestion des menus déroulants Discord
// ========================================

import logger from '../../logger.js';

/**
 * Traiter une interaction de type select menu
 */
export async function handleSelectMenu (interaction, _client, _db, _config) {
  const { customId, values } = interaction;

  try {
    if (customId === 'select_language') {
      const [selectedLang] = values;

      await interaction.reply({
        content: `🌐 Langue sélectionnée : **${selectedLang}**`,
        flags: 64
      });

      return { success: true, message: 'SELECT_MENU_HANDLED', ephemeral: true };
    }

    // Select menu inconnu
    await interaction.reply({
      content: '❌ Menu non reconnu.',
      flags: 64
    });
    return { success: false, message: 'SELECT_MENU_UNKNOWN', ephemeral: true };
  } catch (error) {
    logger.error('Erreur lors du traitement du select menu:', error);
    try {
      await interaction.reply({
        content: '❌ Une erreur est survenue avec le menu déroulant.',
        flags: 64
      });
    } catch (replyError) {
      logger.error('Impossible d\'envoyer une réponse au select menu:', replyError);
    }
    return { success: false, message: 'SELECT_MENU_ERROR', ephemeral: true };
  }
}
