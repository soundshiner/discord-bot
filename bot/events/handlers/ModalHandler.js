// ========================================
// bot/events/handlers/ModalHandler.js - Gestion des soumissions de modaux
// ========================================

/**
 * Traiter une soumission de modal
 */
export async function handleModalSubmit (interaction, _client, _db, _config) {
  const { customId } = interaction;

  if (customId === 'suggestion_modal') {
    // Traitement de la suggestion...
    return {
      success: true,
      message: 'Votre suggestion a été soumise avec succès!',
      ephemeral: true
    };
  }

  return {
    success: false,
    message: 'Modal non reconnu'
  };
}
