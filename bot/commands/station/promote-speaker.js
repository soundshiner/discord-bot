// ========================================
// bot/commands/station/promote-speaker.js - Promotion manuelle en speaker
// ========================================

import { ChannelType } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import logger from '../../logger.js';
import stageSpeakerManager from '../../../core/services/StageSpeakerManager.js';

export default {
  builder: (subcommand) =>
    subcommand
      .setName('promote-speaker')
      .setDescription('Force la promotion du bot en speaker dans le stage channel'),

  async execute (interaction) {
    try {
      const { voice } = interaction.member;
      const channel = voice && voice.channel;

      if (!channel) {
        return {
          success: false,
          message: '❌ Tu dois être dans un salon vocal ou Stage Channel.',
          ephemeral: true
        };
      }

      if (channel.type !== ChannelType.GuildStageVoice) {
        return {
          success: false,
          message: '❌ Cette commande ne fonctionne que dans un Stage Channel.',
          ephemeral: true
        };
      }

      // Vérifier si le bot est connecté
      const connection = getVoiceConnection(interaction.guildId);
      if (!connection) {
        return {
          success: false,
          message: '❌ Le bot n\'est pas connecté à ce stage channel.',
          ephemeral: true
        };
      }

      // Vérifier le statut actuel
      const currentStatus = stageSpeakerManager.getBotStageStatus(interaction.guild, channel);

      if (currentStatus.isSpeaker) {
        return {
          success: false,
          message: 'ℹ️ Le bot est déjà en statut speaker.',
          ephemeral: true
        };
      }

      // Tenter la promotion
      logger.info('🎤 Tentative de promotion manuelle en speaker...');
      const promotionResult = await stageSpeakerManager.promoteToSpeaker(connection, channel);

      if (promotionResult.success) {
        logger.success('🎤 Promotion manuelle en speaker réussie');
        return {
          success: true,
          message: '🎤 Bot promu en speaker avec succès !',
          ephemeral: false
        };
      } else {
        logger.warn('🎤 Promotion manuelle en speaker échouée:', promotionResult.message);

        let errorMessage = `❌ Échec de la promotion en speaker: ${promotionResult.message}`;

        if (promotionResult.missingPermissions && promotionResult.missingPermissions.length > 0) {
          const missingPerms = stageSpeakerManager.formatMissingPermissions(promotionResult.missingPermissions);
          errorMessage += `\n\n🔐 Permissions manquantes:\n${missingPerms.map(perm => `• ${perm}`).join('\n')}`;
        }

        return {
          success: false,
          message: errorMessage,
          ephemeral: true
        };
      }
    } catch (error) {
      logger.error('❌ Erreur dans promote-speaker:', error);
      return {
        success: false,
        message: '❌ Une erreur est survenue lors de la promotion en speaker.',
        ephemeral: true
      };
    }
  }
};
