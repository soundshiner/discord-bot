// ========================================
// bot/events/handlers/InteractionHandler.js - Routage des interactions Discord
// ========================================

import { secureLogger } from '../../../utils/core/secureLogger.js';
import { handleChatInputCommand } from './ChatInputHandler.js';
import { handleButtonInteraction } from './ButtonHandler.js';
import { handleModalSubmit } from './ModalHandler.js';
import { handleSelectMenu } from './SelectMenuHandler.js';

/**
 * Router principal pour traiter les interactions selon leur type
 */
export async function handleInteractionByType(interaction, client, db, config) {
  const commandName = interaction.commandName || interaction.customId;

  // Log de début de traitement
  secureLogger.secureLog('info', `Traitement de l'interaction ${commandName}`, {
    userId: interaction.user.id,
    commandName,
    timestamp: new Date().toISOString()
  });

  // Traitement selon le type d'interaction
  if (interaction.isChatInputCommand()) {
    return await handleChatInputCommand(interaction, client, db, config);
  } else if (interaction.isButton()) {
    return await handleButtonInteraction(interaction, client, db, config);
  } else if (interaction.isModalSubmit()) {
    return await handleModalSubmit(interaction, client, db, config);
  } else if (interaction.isSelectMenu()) {
    return await handleSelectMenu(interaction, client, db, config);
  }

  return { success: false, message: 'Type d\'interaction non supporté' };
}