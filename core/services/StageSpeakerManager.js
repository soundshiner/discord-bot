// ========================================
// core/services/StageSpeakerManager.js - Gestion de l'auto-promotion en speaker
// ========================================

import { PermissionFlagsBits } from 'discord.js';
import logger from '../../bot/logger.js';

class StageSpeakerManager {
  constructor () {
    this.requiredPermissions = [
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.RequestToSpeak
    ];

    logger.info('🎤 StageSpeakerManager initialisé');
  }

  /**
   * Vérifier si le bot a les permissions nécessaires pour s'auto-promouvoir
   */
  checkBotPermissions (guild, channel) {
    try {
      const botMember = guild.members.me;
      if (!botMember) {
        logger.error('🎤 Bot member introuvable dans le guild');
        return { hasPermissions: false, missingPermissions: this.requiredPermissions };
      }

      const channelPermissions = channel.permissionsFor(botMember);
      if (!channelPermissions) {
        logger.error('🎤 Impossible de récupérer les permissions du canal');
        return { hasPermissions: false, missingPermissions: this.requiredPermissions };
      }

      const missingPermissions = this.requiredPermissions.filter(permission =>
        !channelPermissions.has(permission));

      const hasPermissions = missingPermissions.length === 0;

      logger.debug('🎤 Vérification des permissions:', {
        hasPermissions,
        missingPermissions: missingPermissions.map(p => PermissionFlagsBits[p]),
        channelId: channel.id,
        channelName: channel.name
      });

      return { hasPermissions, missingPermissions };
    } catch (error) {
      logger.error('🎤 Erreur lors de la vérification des permissions:', error);
      return { hasPermissions: false, missingPermissions: this.requiredPermissions };
    }
  }

  /**
   * Tenter de promouvoir le bot en speaker
   */
  async promoteToSpeaker (connection, channel) {
    try {
      if (!connection || !channel) {
        throw new Error('Connexion ou canal manquant');
      }

      // Vérifier les permissions d'abord
      const { hasPermissions, missingPermissions } = this.checkBotPermissions(channel.guild, channel);

      if (!hasPermissions) {
        const missingNames = missingPermissions.map(p => PermissionFlagsBits[p]).join(', ');
        logger.warn(`🎤 Permissions manquantes pour l'auto-promotion: ${missingNames}`);
        return {
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Permissions manquantes: ${missingNames}`,
          missingPermissions
        };
      }

      // Tenter de promouvoir le bot
      logger.info('🎤 Tentative de promotion du bot en speaker...');

      // Dans discord.js v14, on utilise setSuppressed(false) pour promouvoir en speaker
      await connection.voice.setSuppressed(false);

      logger.success('🎤 Bot promu en speaker avec succès');

      return {
        success: true,
        message: 'Bot promu en speaker avec succès'
      };
    } catch (error) {
      logger.error('🎤 Erreur lors de la promotion en speaker:', error);

      // Analyser le type d'erreur
      let errorType = 'UNKNOWN_ERROR';
      let userMessage = 'Erreur inconnue lors de la promotion en speaker';

      if (error.code === 50013) {
        errorType = 'INSUFFICIENT_PERMISSIONS';
        userMessage = 'Permissions insuffisantes pour la promotion en speaker';
      } else if (error.code === 50001) {
        errorType = 'MISSING_ACCESS';
        userMessage = 'Accès manquant au canal vocal';
      } else if (error.message.includes('suppressed')) {
        errorType = 'SUPPRESSION_ERROR';
        userMessage = 'Erreur lors de la modification du statut de suppression';
      }

      return {
        success: false,
        error: errorType,
        message: userMessage,
        originalError: error.message
      };
    }
  }

  /**
   * Vérifier le statut actuel du bot dans le stage
   */
  getBotStageStatus (guild, channel) {
    try {
      const botMember = guild.members.me;
      if (!botMember || !botMember.voice) {
        return {
          isConnected: false,
          isSpeaker: false,
          isSuppressed: true,
          channelId: null
        };
      }

      const isConnected = botMember.voice.channelId === channel.id;
      const isSuppressed = botMember.voice.suppress;
      const isSpeaker = isConnected && !isSuppressed;

      return {
        isConnected,
        isSpeaker,
        isSuppressed,
        channelId: botMember.voice.channelId
      };
    } catch (error) {
      logger.error('🎤 Erreur lors de la vérification du statut du stage:', error);
      return {
        isConnected: false,
        isSpeaker: false,
        isSuppressed: true,
        channelId: null
      };
    }
  }

  /**
   * Obtenir des informations détaillées sur les permissions et le statut
   */
  getDetailedStatus (guild, channel, _connection) {
    const permissions = this.checkBotPermissions(guild, channel);
    const stageStatus = this.getBotStageStatus(guild, channel);

    return {
      permissions,
      stageStatus,
      canAutoPromote: permissions.hasPermissions && stageStatus.isConnected,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Formater les permissions manquantes pour l'affichage
   */
  formatMissingPermissions (missingPermissions) {
    const permissionNames = {
      [PermissionFlagsBits.Connect]: 'Se connecter',
      [PermissionFlagsBits.Speak]: 'Parler',
      [PermissionFlagsBits.RequestToSpeak]: 'Demander à parler'
    };

    return missingPermissions.map(permission =>
      permissionNames[permission] || `Permission inconnue (${permission})`);
  }
}

// Instance singleton
const stageSpeakerManager = new StageSpeakerManager();

export default stageSpeakerManager;
