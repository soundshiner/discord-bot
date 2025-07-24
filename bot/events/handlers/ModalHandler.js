// ========================================
// bot/events/handlers/ModalHandler.js - Gestion des modals Discord
// ========================================

import logger from '../../logger.js';

/**
 * Traiter une interaction de type modal submit
 */
export async function handleModalSubmit(interaction, _client, _db, _config) {
  const { customId, fields } = interaction;

  try {
    // Exemple : traiter un modal de feedback
    if (customId === 'feedback_modal') {
      const feedback = fields.getTextInputValue('feedback_field');

      logger.info(`Feedback reçu de ${interaction.user.username}: ${feedback}`);

      await interaction.reply({
        content: '🙏 Merci pour votre retour!',
        flags: 64 // MessageFlags.Ephemeral
      });

      return { success: true, message: 'MODAL_HANDLED', ephemeral: true };
    }

    // Si modal inconnu
    await interaction.reply({
      content: '❌ Modal non reconnu.',
      flags: 64
    });
    return { success: false, message: 'MODAL_UNKNOWN', ephemeral: true };

  } catch (error) {
    logger.error('Erreur lors du traitement du modal:', error);
    try {
      await interaction.reply({
        content: '❌ Une erreur est survenue en traitant votre formulaire.',
        flags: 64
      });
    } catch (replyError) {
      logger.error('Impossible de répondre à l\'erreur du modal:', replyError);
    }
    return { success: false, message: 'MODAL_ERROR', ephemeral: true };
  }
}
