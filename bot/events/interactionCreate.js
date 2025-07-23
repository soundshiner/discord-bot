// ========================================
// bot/events/interactionCreate.js - Gestion sécurisée des interactions Discord
// ========================================

import { Events } from 'discord.js';
import AppState from '../../core/services/AppState.js';
import { RetryManager } from '../../utils/core/retry.js';
import { checkRateLimit, recordCommand } from '../../utils/core/rateLimiter.js';
import {
  validateSuggestion,
  validateDiscordId,
  sanitizeString
} from '../../utils/core/validation.js';
import {
  secureLogger,
  secureAudit,
  secureSecurityAlert
} from '../../utils/core/secureLogger.js';
import logger from '../logger.js';

// Ajout de la fonction safeStringify pour éviter l'erreur BigInt
function safeStringify (obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Gérer les BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Gérer les références circulaires
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }

    return value;
  });
}

// Instance de RetryManager pour les interactions Discord
const interactionRetryManager = new RetryManager({
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'],
  onRetry: (error, attempt, delay) => {
    logger.warn(`Interaction retry ${attempt}: ${error.message} (${delay}ms)`);
  }
});

export default {
  name: Events.InteractionCreate,
  async execute (interaction) {
    const startTime = Date.now();
    const { client, db } = AppState;

    logger.info(
      `AppState - client: ${client ? 'défini' : 'undefined'}, db: ${
        db ? 'défini' : 'undefined'
      }`
    );

    // Utiliser interaction.client comme fallback si AppState.client est undefined
    const discordClient = client || interaction.client;
    const discordConfig = (await import('../config.js')).default;

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
          flags: 64 // MessageFlags.Ephemeral
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
          flags: 64 // MessageFlags.Ephemeral
        });
        return;
      }

      logger.info(`Validation réussie pour la commande ${commandName}`);

      // Enregistrer l'exécution de la commande
      recordCommand(userId, commandType);

      // Traitement de l'interaction avec retry
      let result;
      try {
        result = await interactionRetryManager.execute(
          async () => {
            logger.info(`Début du traitement de l'interaction ${commandName}`);

            // Pour les interactions de boutons, on traite directement sans retour d'objet
            if (interaction.isButton()) {
              logger.info('Traitement d\'un bouton');
              const buttonResult = await handleButtonInteraction(
                interaction,
                discordClient,
                db,
                discordConfig
              );
              logger.info(`Résultat du bouton: ${safeStringify(buttonResult)}`);
              return buttonResult;
            }

            logger.info('Traitement d\'une commande normale');
            const interactionResult = await handleInteraction(
              interaction,
              discordClient,
              db,
              discordConfig
            );
            logger.info(
              `Résultat de l'interaction: ${safeStringify(interactionResult)}`
            );
            return interactionResult;
          },
          {
            maxAttempts: 3,
            baseDelay: 1000,
            context: { userId, commandName, interactionType }
          }
        );
      } catch (error) {
        logger.error(
          `Erreur dans RetryManager.execute: ${error.message}`,
          error
        );

        // Vérifier si l'interaction a déjà été répondue avant d'essayer de répondre
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              '❌ Une erreur est survenue lors du traitement de votre demande.',
            flags: 64 // MessageFlags.Ephemeral
          });
        } else if (interaction.deferred) {
          // Si l'interaction a été différée, utiliser editReply
          await interaction.editReply({
            content:
              '❌ Une erreur est survenue lors du traitement de votre demande.'
          });
        }
        // Si interaction.replied est true, ne rien faire car la réponse a déjà été envoyée
        return;
      }

      logger.info(
        `Résultat final après RetryManager: ${safeStringify(result)}`
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
        logger.info(
          `Résultat de commande: ${result.message}, deferReply: ${result.deferReply}`
        );

        // Pour les boutons, on ne fait rien car ils sont déjà traités
        if (result.message === 'BUTTON_HANDLED') {
          logger.info('Bouton traité avec succès');
          return;
        }

        // Gestion spéciale pour les commandes qui nécessitent deferReply
        if (result.deferReply) {
          logger.info(
            'Commande nécessite deferReply, appel de interaction.deferReply()'
          );
          await interaction.deferReply();

          // Traitement spécial pour la commande play
          if (result.message === 'PLAY_COMMAND') {
            logger.info('Traitement de la commande PLAY_COMMAND');
            await handlePlayCommand(interaction, discordClient);
            return;
          }

          // Traitement spécial pour la commande schedule
          if (result.message === 'SCHEDULE_COMMAND') {
            logger.info('Traitement de la commande SCHEDULE_COMMAND');
            await handleScheduleCommand(interaction, result);
          }
        } else {
          logger.info('Réponse normale avec interaction.reply()');
          await interaction.reply({
            content: result.message,
            flags: result.ephemeral !== false ? 64 : 0 // 64 = MessageFlags.Ephemeral
          });
        }
      } else {
        logger.warn('Résultat de commande échoué ou null');
        await interaction.reply({
          content:
            '❌ Une erreur est survenue lors du traitement de votre demande.',
          flags: 64 // MessageFlags.Ephemeral
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

        // Vérifier si l'interaction a déjà été répondue avant d'essayer de répondre
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: errorMessage,
            flags: 64 // MessageFlags.Ephemeral
          });
        } else if (interaction.deferred) {
          // Si l'interaction a été différée, utiliser editReply
          await interaction.editReply({
            content: errorMessage
          });
        }
        // Si interaction.replied est true, ne rien faire car la réponse a déjà été envoyée
      } catch (replyError) {
        // Log spécifique pour l'erreur InteractionAlreadyReplied
        if (
          replyError.message
          && replyError.message.includes('InteractionAlreadyReplied')
        ) {
          logger.error('🚨 ERREUR InteractionAlreadyReplied détectée:', {
            error: replyError.message,
            interactionState: {
              replied: interaction.replied,
              deferred: interaction.deferred,
              commandName: interaction.commandName,
              userId: interaction.user?.id
            }
          });
        }
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
    case 'suggestion':
    case 'suggest': {
      const titre = options.getString('titre');
      const artiste = options.getString('artiste');

      if (!titre) {
        return { valid: false, error: 'Le titre est requis' };
      }

      if (!artiste) {
        return { valid: false, error: 'L\'artiste est requis' };
      }

      const validatedTitre = validateSuggestion(titre, interaction.user.id);
      const validatedArtiste = validateSuggestion(
        artiste,
        interaction.user.id
      );

      // Mettre à jour les options avec les valeurs validées
      options._hoistedOptions = options._hoistedOptions.map((opt) => {
        if (opt.name === 'titre') {
          return { ...opt, value: validatedTitre };
        }
        if (opt.name === 'artiste') {
          return { ...opt, value: validatedArtiste };
        }
        return opt;
      });
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

    case 'suggest-delete': {
      const suggestionId = options.getInteger('id');
      if (!suggestionId || suggestionId <= 0) {
        return { valid: false, error: 'ID de suggestion invalide' };
      }
      break;
    }

    case 'suggest-edit': {
      const suggestionId = options.getInteger('id');
      if (!suggestionId || suggestionId <= 0) {
        return { valid: false, error: 'ID de suggestion invalide' };
      }

      const newTitre = options.getString('titre');
      const newArtiste = options.getString('artiste');

      if (newTitre) {
        const validatedTitre = validateSuggestion(
          newTitre,
          interaction.user.id
        );
        options._hoistedOptions = options._hoistedOptions.map((opt) =>
          opt.name === 'titre' ? { ...opt, value: validatedTitre } : opt);
      }

      if (newArtiste) {
        const validatedArtiste = validateSuggestion(
          newArtiste,
          interaction.user.id
        );
        options._hoistedOptions = options._hoistedOptions.map((opt) =>
          opt.name === 'artiste' ? { ...opt, value: validatedArtiste } : opt);
      }
      break;
    }

    case 'list_suggestions': {
      // Pas de validation spéciale nécessaire pour cette commande
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
async function handleChatInputCommand (interaction, _client, _db, _config) {
  const { commandName } = interaction;

  // Liste des commandes qui ont des fichiers dédiés
  const commandsWithFiles = [
    'ping',
    'drink',
    'force',
    'play',
    'stop',
    'nowplaying',
    'stats',
    'getwallpaper',
    'schedule',
    'suggest',
    'suggest-delete',
    'suggest-edit',
    'list_suggestions',
    'silence'
  ];

  // Si la commande a un fichier dédié, l'utiliser
  if (commandsWithFiles.includes(commandName)) {
    try {
      const commandFile = await import(
        `../commands/${
          commandName === 'list_suggestions' ? 'suggest-list' : commandName
        }.js`
      );
      return await commandFile.default.execute(interaction);
    } catch (error) {
      logger.error(`Erreur dans la commande ${commandName}:`, error);
      return {
        success: false,
        message: `❌ Erreur lors de l'exécution de la commande ${commandName}.`,
        ephemeral: true
      };
    }
  }

  // Commandes qui n'ont pas de fichiers dédiés (à traiter ici)
  switch (commandName) {
  case 'help':
    return {
      success: true,
      message:
          '📚 **Commandes disponibles:**\n'
          + '• `/ping` - Vérifier la latence\n'
          + '• `/drink <utilisateur>` - Offrir un verre à quelqu\'un\n'
          + '• `/force <on/off>` - Activer/désactiver la Force\n'
          + '• `/play` - Lancer le stream dans un Stage Channel\n'
          + '• `/stop` - Arrêter le stream\n'
          + '• `/nowplaying` - Voir le statut actuel\n'
          + '• `/stats` - Voir les statistiques du bot\n'
          + '• `/suggest <titre> <artiste>` - Proposer une suggestion\n'
          + '• `/suggest-delete <id>` - Supprimer une suggestion\n'
          + '• `/suggest-edit <id>` - Modifier une suggestion\n'
          + '• `/list_suggestions` - Voir toutes les suggestions\n'
          + '• `/getwallpaper` - Récupérer un wallpaper aléatoire\n'
          + '• `/schedule` - Afficher l\'horaire des programmes\n'
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

  try {
    if (customId.startsWith('suggestion_')) {
      // Traitement des boutons de suggestion...
      await interaction.reply({
        content: 'Action effectuée avec succès!',
        flags: 64 // MessageFlags.Ephemeral
      });
      return { success: true, message: 'BUTTON_HANDLED', ephemeral: false };
    }

    if (customId === 'schedule_fr' || customId === 'schedule_en') {
      // Traitement des boutons de schedule
      const scheduleService = (
        await import('../../core/services/ScheduleService.js')
      ).default;
      const { EmbedBuilder } = await import('discord.js');

      const language = customId === 'schedule_fr' ? 'fr' : 'en';
      const schedule = await scheduleService.getFormattedSchedule(language);

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(language === 'fr' ? 0xf1c40f : 0x2ecc71)
            .setTitle(schedule.title)
            .setDescription(schedule.content)
        ],
        components: []
      });

      return { success: true, message: 'BUTTON_HANDLED', ephemeral: false };
    }

    if (customId === 'show_full_stats') {
      // Traitement du bouton stats complètes Icecast
      try {
        const axios = (await import('axios')).default;
        const config = (await import('../config.js')).default;

        const { data } = await axios.get(config.JSON_URL);

        await interaction.update({
          content: `📊 **Stats complètes Icecast**\n\`\`\`json\n${safeStringify(
            data
          )}\n\`\`\``,
          components: []
        });
      } catch (error) {
        logger.error('Erreur stats complètes:', error);
        await interaction.update({
          content: '❌ Impossible de récupérer les stats complètes.',
          components: []
        });
      }

      return { success: true, message: 'BUTTON_HANDLED', ephemeral: false };
    }

    // Bouton non reconnu
    await interaction.reply({
      content: '❌ Bouton non reconnu',
      flags: 64 // MessageFlags.Ephemeral
    });
    return { success: true, message: 'BUTTON_HANDLED', ephemeral: false };
  } catch (error) {
    logger.error('Erreur lors du traitement du bouton:', error);
    try {
      await interaction.reply({
        content: '❌ Une erreur est survenue lors du traitement du bouton.',
        flags: 64 // MessageFlags.Ephemeral
      });
    } catch (replyError) {
      logger.error(
        'Impossible d\'envoyer la réponse d\'erreur pour le bouton:',
        replyError
      );
    }
    return { success: true, message: 'BUTTON_HANDLED', ephemeral: false };
  }
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
      message: 'Votre suggestion a été soumise avec succès!',
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

/**
 * Traiter la commande play (fonction manquante)
 */
async function handlePlayCommand (interaction, _client) {
  try {
    logger.info('🚀 Début de handlePlayCommand');

    const { voice } = interaction.member;
    const channel = voice && voice.channel;

    logger.info('📡 Vérification du canal vocal:', {
      hasVoice: !!voice,
      hasChannel: !!channel,
      channelType: channel?.type
    });

    // Import des modules nécessaires
    logger.info('📦 Import des modules audio...');
    const {
      joinVoiceChannel,
      createAudioPlayer,
      createAudioResource,
      AudioPlayerStatus,
      NoSubscriberBehavior
    } = await import('@discordjs/voice');
    logger.success('Modules audio importés avec succès');

    const config = (await import('../config.js')).default;
    const { STREAM_URL } = config;
    logger.info('🔗 URL du stream récupérée:', STREAM_URL ? 'OK' : 'MANQUANTE');

    logger.info('🔌 Connexion au canal vocal...');
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false
    });
    logger.success('Connexion établie');

    logger.info('🎵 Création du player audio...');
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });
    logger.success(' Player créé');

    logger.info('🎼 Création de la ressource audio...');
    const resource = createAudioResource(STREAM_URL, {
      inlineVolume: true
    });
    logger.success(' Ressource audio créée');

    logger.info('▶️ Lancement de la lecture...');
    player.play(resource);
    connection.subscribe(player);
    logger.success(' Lecture lancée');

    interaction.client.audio = { connection, player };
    logger.info('💾 Audio sauvegardé dans client.audio');

    // 🔁 Sécurité si le stream prend trop de temps
    const timeout = setTimeout(() => {
      logger.warn('⏰ Timeout de 5s atteint');
      interaction.editReply('⚠️ Aucun son détecté après 5s. Lecture échouée ?');
    }, 5000);

    player.once(AudioPlayerStatus.Playing, async () => {
      logger.info('🎵 Événement Playing détecté');
      clearTimeout(timeout);
      await interaction.editReply('▶️ Stream lancé dans le stage channel.');
      logger.success(' Message de succès envoyé');
    });

    player.on('error', async (error) => {
      logger.error('❌ Erreur du player:', error);
      clearTimeout(timeout);
      return await interaction.editReply(
        '❌ Erreur pendant la lecture du stream.'
      );
    });

    logger.success(' handlePlayCommand terminé avec succès');
  } catch (error) {
    logger.error('❌ Erreur lors du traitement de la commande play:', error);
    // L'interaction est déjà différée par le code principal, donc on utilise editReply
    await interaction.editReply({
      content: '❌ Erreur lors de l\'exécution de la commande play.'
    });
  }
}

/**
 * Traiter la commande schedule (fonction manquante)
 */
async function handleScheduleCommand (interaction, _result) {
  try {
    // Import dynamique de la commande schedule
    const scheduleCommand = await import('../commands/schedule.js');
    const result = await scheduleCommand.default.execute(interaction);

    // L'interaction est déjà différée par le code principal, donc on utilise editReply
    if (result && result.success) {
      await interaction.editReply({
        content: result.message,
        flags: result.ephemeral !== false ? 64 : 0
      });
    } else {
      await interaction.editReply({
        content: '❌ Erreur lors de l\'exécution de la commande schedule.',
        flags: 64
      });
    }
  } catch (error) {
    logger.error('Erreur lors du traitement de la commande schedule:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de l\'exécution de la commande schedule.',
      flags: 64
    });
  }
}

