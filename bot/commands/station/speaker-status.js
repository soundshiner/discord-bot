// ========================================
// bot/commands/station/speaker-status.js - Vérification du statut speaker
// ========================================

import { ChannelType, EmbedBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import logger from '../../logger.js';
import stageSpeakerManager from '../../../core/services/StageSpeakerManager.js';

export default {
  builder: (subcommand) =>
    subcommand
      .setName('speaker-status')
      .setDescription('Vérifie le statut et les permissions du bot dans le stage channel'),

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

      // Obtenir le statut détaillé
      const detailedStatus = stageSpeakerManager.getDetailedStatus(
        interaction.guild,
        channel,
        connection
      );

      // Créer un embed informatif
      const embed = new EmbedBuilder()
        .setTitle('🎤 Statut du Bot dans le Stage')
        .setColor(detailedStatus.canAutoPromote ? 0x00ff00 : 0xffaa00)
        .setTimestamp()
        .addFields(
          {
            name: '📡 Connexion',
            value: detailedStatus.stageStatus.isConnected ? '✅ Connecté' : '❌ Non connecté',
            inline: true
          },
          {
            name: '🎤 Statut Speaker',
            value: detailedStatus.stageStatus.isSpeaker ? '✅ Speaker' : '❌ Auditeur',
            inline: true
          },
          {
            name: '🔇 Supprimé',
            value: detailedStatus.stageStatus.isSuppressed ? '✅ Oui' : '❌ Non',
            inline: true
          }
        );

      // Ajouter les permissions
      const permissionFields = [];
      if (detailedStatus.permissions.hasPermissions) {
        permissionFields.push({
          name: '🔐 Permissions',
          value: '✅ Toutes les permissions requises',
          inline: false
        });
      } else {
        const missingPerms = stageSpeakerManager.formatMissingPermissions(
          detailedStatus.permissions.missingPermissions
        );
        permissionFields.push({
          name: '🔐 Permissions Manquantes',
          value: `❌ ${missingPerms.join(', ')}`,
          inline: false
        });
      }

      embed.addFields(permissionFields);

      // Ajouter le statut d'auto-promotion
      embed.addFields({
        name: '🤖 Auto-promotion',
        value: detailedStatus.canAutoPromote ? '✅ Possible' : '❌ Impossible',
        inline: false
      });

      // Ajouter des conseils si nécessaire
      if (!detailedStatus.canAutoPromote) {
        let advice = '';
        if (!detailedStatus.permissions.hasPermissions) {
          advice += '• Vérifiez que le bot a les permissions: Se connecter, Parler, Demander à parler\n';
        }
        if (!detailedStatus.stageStatus.isConnected) {
          advice += '• Le bot doit être connecté au stage channel\n';
        }

        if (advice) {
          embed.addFields({
            name: '💡 Conseils',
            value: advice.trim(),
            inline: false
          });
        }
      }

      return {
        success: true,
        message: { embeds: [embed] },
        ephemeral: true
      };
    } catch (error) {
      logger.error('❌ Erreur dans speaker-status:', error);
      return {
        success: false,
        message: '❌ Une erreur est survenue lors de la vérification du statut.',
        ephemeral: true
      };
    }
  }
};
