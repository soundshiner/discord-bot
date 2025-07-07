// ========================================
// bot/events/interactionCreate.js - Gestion sécurisée des interactions Discord
// ========================================

import { Events } from 'discord.js';
import AppState from '../../core/services/AppState.js';
import { RetryManager } from '../../core/utils/retry.js';
import { checkRateLimit, recordCommand } from '../../core/utils/rateLimiter.js';
import {
  validateSuggestion,
  validateDiscordId,
  sanitizeString
} from '../../core/utils/validation.js';
import {
  secureLogger,
  secureAudit,
  secureSecurityAlert
} from '../../core/utils/secureLogger.js';
import logger from '../logger.js';

export default {
  name: Events.InteractionCreate,
  async execute (interaction) {
    const startTime = Date.now();
    const { client, db, config } = AppState.getInstance();

    try {
      // Validation de base de l'interaction
      if (!interaction || !interaction.user) {
        logger.warn('Interaction invalide reçue');
        return;
      }

      const userId = interaction.user.id;
      const commandName
        = interaction.commandName || interaction.customId || 'unknown';
      const interactionType = interaction.type || 'unknown';

      // Log sécurisé de l'interaction
      secureAudit('Interaction Discord reçue', userId, {
        commandName,
        interactionType,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        timestamp: new Date().toISOString()
      });

      // Rate limiting par type de commande
      const commandType = getCommandType(commandName);
      const rateLimitResult = checkRateLimit(userId, commandType);

      if (!rateLimitResult.allowed) {
        const remainingTime = Math.ceil(rateLimitResult.remainingTime / 1000);

        secureSecurityAlert(
          'Rate limit Discord dépassé',
          {
            userId,
            commandName,
            commandType,
            remainingTime,
            reason: rateLimitResult.reason
          },
          userId
        );

        const errorMessage
          = rateLimitResult.reason === 'USER_BLOCKED'
            ? `Vous êtes temporairement bloqué. Réessayez dans ${remainingTime} secondes.`
            : `Trop de commandes. Réessayez dans ${remainingTime} secondes.`;

        await interaction.reply({
          content: `⚠️ ${errorMessage}`,
          ephemeral: true
        });
        return;
      }

      // Validation et sanitization des entrées utilisateur
      const validationResult = await validateInteractionInput(interaction);
      if (!validationResult.valid) {
        secureSecurityAlert(
          'Entrée utilisateur invalide',
          {
            userId,
            commandName,
            error: validationResult.error,
            input: validationResult.input
          },
          userId
        );

        await interaction.reply({
          content: `❌ ${validationResult.error}`,
          ephemeral: true
        });
        return;
      }

      // Enregistrer l'exécution de la commande
      recordCommand(userId, commandType);

      // Traitement de l'interaction avec retry
      const result = await RetryManager.executeWithRetry(
        async () => {
          return await handleInteraction(interaction, client, db, config);
        },
        {
          operation: `Interaction ${commandName}`,
          maxRetries: 3,
          baseDelay: 1000,
          context: { userId, commandName, interactionType }
        }
      );

      // Log de performance
      const duration = Date.now() - startTime;
      secureLogger.securePerformance(`Interaction ${commandName}`, duration, {
        userId,
        commandType,
        success: true
      });

      // Réponse à l'utilisateur
      if (result && result.success) {
        await interaction.reply({
          content: result.message,
          ephemeral: result.ephemeral !== false
        });
      } else {
        await interaction.reply({
          content:
            '❌ Une erreur est survenue lors du traitement de votre demande.',
          ephemeral: true
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log d'erreur sécurisé
      secureLogger.secureError(
        'Erreur lors du traitement d\'interaction',
        error,
        {
          userId: interaction?.user?.id,
          commandName: interaction?.commandName || interaction?.customId,
          interactionType: interaction?.type,
          duration: `${duration}ms`
        }
      );

      // Réponse d'erreur à l'utilisateur
      try {
        const errorMessage
          = interaction.replied || interaction.deferred
            ? '❌ Une erreur est survenue lors du traitement de votre demande.'
            : '❌ Une erreur inattendue s\'est produite.';

        await interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      } catch (replyError) {
        logger.error('Impossible d\'envoyer la réponse d\'erreur', replyError);
      }
    }
  }
};

/**
 * Déterminer le type de commande pour le rate limiting
 */
function getCommandType (commandName) {
  const commandMap = {
    // Commandes de suggestion
    'suggestion': 'suggestion',
    'suggest': 'suggestion',
    'propose': 'suggestion',

    // Commandes DJ/Admin
    'dj': 'dj',
    'admin': 'dj',
    'moderate': 'dj',
    'ban': 'dj',
    'kick': 'dj',

    // Commandes critiques
    'shutdown': 'critical',
    'restart': 'critical',
    'config': 'critical',

    // Commandes générales (par défaut)
    'ping': 'general',
    'help': 'general',
    'info': 'general'
  };

  return commandMap[commandName] || 'general';
}

/**
 * Valider et sanitizer les entrées de l'interaction
 */
async function validateInteractionInput (interaction) {
  try {
    const userId = interaction.user.id;

    // Validation de base
    if (!validateDiscordId(userId)) {
      return { valid: false, error: 'ID utilisateur invalide' };
    }

    if (interaction.guildId && !validateDiscordId(interaction.guildId)) {
      return { valid: false, error: 'ID serveur invalide' };
    }

    // Validation spécifique selon le type d'interaction
    if (interaction.isChatInputCommand()) {
      return await validateChatInputCommand(interaction);
    } else if (interaction.isButton()) {
      return await validateButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      return await validateModalSubmit(interaction);
    } else if (interaction.isSelectMenu()) {
      return await validateSelectMenu(interaction);
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Erreur de validation de la commande',
      input: {
        commandName: interaction.commandName || interaction.customId,
        options: interaction.options?.data
      }
    };
  }
}

/**
 * Valider une commande slash
 */
async function validateChatInputCommand (interaction) {
  const { commandName } = interaction;
  const { options } = interaction;

  try {
    // Validation spécifique par commande
    switch (commandName) {
    case 'suggestion': {
      const suggestionText = options.getString('text');
      if (!suggestionText) {
        return { valid: false, error: 'Le texte de suggestion est requis' };
      }

      const validatedSuggestion = validateSuggestion(
        suggestionText,
        interaction.user.id
      );
        // Mettre à jour l'option avec la valeur validée
      options._hoistedOptions = options._hoistedOptions.map((opt) =>
        opt.name === 'text' ? { ...opt, value: validatedSuggestion } : opt);
      break;
    }

    case 'ban':
    case 'kick': {
      const targetUser = options.getUser('user');
      if (!targetUser) {
        return { valid: false, error: 'Utilisateur cible requis' };
      }

      if (!validateDiscordId(targetUser.id)) {
        return { valid: false, error: 'ID utilisateur cible invalide' };
      }

      const reason = options.getString('reason');
      if (reason) {
        const sanitizedReason = sanitizeString(reason, { maxLength: 500 });
        options._hoistedOptions = options._hoistedOptions.map((opt) =>
          opt.name === 'reason' ? { ...opt, value: sanitizedReason } : opt);
      }
      break;
    }

    case 'config': {
      // Validation des paramètres de configuration
      const configKey = options.getString('key');
      const configValue = options.getString('value');

      if (configKey && !(/^[a-zA-Z0-9._-]+$/).test(configKey)) {
        return { valid: false, error: 'Clé de configuration invalide' };
      }

      if (configValue) {
        const sanitizedValue = sanitizeString(configValue, {
          maxLength: 1000
        });
        options._hoistedOptions = options._hoistedOptions.map((opt) =>
          opt.name === 'value' ? { ...opt, value: sanitizedValue } : opt);
      }
      break;
    }

    default:
      break;
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Erreur de validation de la commande',
      input: { commandName, options: options?.data }
    };
  }
}

/**
 * Valider une interaction de bouton
 */
async function validateButtonInteraction (interaction) {
  const { customId } = interaction;

  try {
    // Validation des IDs de bouton personnalisés
    if (!(/^[a-zA-Z0-9_-]+$/).test(customId)) {
      return { valid: false, error: 'ID de bouton invalide' };
    }

    // Validation spécifique selon le type de bouton
    if (customId.startsWith('suggestion_')) {
      const suggestionId = customId.replace('suggestion_', '');
      if (!(/^\d+$/).test(suggestionId)) {
        return { valid: false, error: 'ID de suggestion invalide' };
      }
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Erreur de validation du bouton',
      input: customId
    };
  }
}

/**
 * Valider une soumission de modal
 */
async function validateModalSubmit (interaction) {
  const { customId } = interaction;
  const { fields } = interaction;

  try {
    // Validation de l'ID du modal
    if (!(/^[a-zA-Z0-9_-]+$/).test(customId)) {
      return { valid: false, error: 'ID de modal invalide' };
    }

    // Validation des champs selon le type de modal
    if (customId === 'suggestion_modal') {
      const suggestionText = fields.getTextInputValue('suggestion_text');
      if (!suggestionText) {
        return { valid: false, error: 'Le texte de suggestion est requis' };
      }

      const validatedSuggestion = validateSuggestion(
        suggestionText,
        interaction.user.id
      );
      // Mettre à jour le champ avec la valeur validée
      fields._components = fields._components.map((component) =>
        component.customId === 'suggestion_text'
          ? { ...component, value: validatedSuggestion }
          : component);
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Erreur de validation du modal',
      input: { customId, fields: fields?.data }
    };
  }
}

/**
 * Valider un menu de sélection
 */
async function validateSelectMenu (interaction) {
  const { customId } = interaction;
  const { values } = interaction;

  try {
    // Validation de l'ID du menu
    if (!(/^[a-zA-Z0-9_-]+$/).test(customId)) {
      return { valid: false, error: 'ID de menu invalide' };
    }

    // Validation des valeurs sélectionnées
    if (values && values.length > 0) {
      for (const value of values) {
        if (!(/^[a-zA-Z0-9_-]+$/).test(value)) {
          return { valid: false, error: 'Valeur de sélection invalide' };
        }
      }
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Erreur de validation du menu',
      input: { customId, values }
    };
  }
}

/**
 * Traiter l'interaction principale
 */
async function handleInteraction (interaction, client, db, config) {
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

/**
 * Traiter une commande slash
 */
async function handleChatInputCommand (interaction, client, _db, _config) {
  const { commandName } = interaction;

  switch (commandName) {
  case 'ping':
    return {
      success: true,
      message: `🏓 Pong! Latence: ${client.ws.ping}ms`,
      ephemeral: false
    };

  case 'suggestion':
    // Traitement de la suggestion...
    return {
      success: true,
      message: '✅ Votre suggestion a été enregistrée avec succès!',
      ephemeral: true
    };

  case 'help':
    return {
      success: true,
      message:
          '📚 **Commandes disponibles:**\n'
          + '• `/ping` - Vérifier la latence\n'
          + '• `/suggestion <texte>` - Proposer une suggestion\n'
          + '• `/help` - Afficher cette aide',
      ephemeral: false
    };

  default:
    return {
      success: false,
      message: 'Commande non reconnue'
    };
  }
}

/**
 * Traiter une interaction de bouton
 */
async function handleButtonInteraction (interaction, _client, _db, _config) {
  const { customId } = interaction;

  if (customId.startsWith('suggestion_')) {
    // Traitement des boutons de suggestion...
    return {
      success: true,
      message: '✅ Action effectuée avec succès!',
      ephemeral: true
    };
  }

  return {
    success: false,
    message: 'Bouton non reconnu'
  };
}

/**
 * Traiter une soumission de modal
 */
async function handleModalSubmit (interaction, _client, _db, _config) {
  const { customId } = interaction;

  if (customId === 'suggestion_modal') {
    // Traitement de la suggestion...
    return {
      success: true,
      message: '✅ Votre suggestion a été soumise avec succès!',
      ephemeral: true
    };
  }

  return {
    success: false,
    message: 'Modal non reconnu'
  };
}

/**
 * Traiter un menu de sélection
 */
async function handleSelectMenu (_interaction, _client, _db, _config) {
  // Traitement des menus de sélection...
  return {
    success: true,
    message: '✅ Sélection effectuée avec succès!',
    ephemeral: true
  };
}

