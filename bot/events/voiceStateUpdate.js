// ========================================
// bot/events/voiceStateUpdate.js - Gestion des changements d'état vocal
// ========================================

import { Events } from 'discord.js';
import logger from '../logger.js';
import stageMonitor from '../../core/services/StageMonitor.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute (oldState, newState) {
    try {
      // Gérer les changements d'état vocal pour le monitoring des stages
      stageMonitor.handleVoiceStateUpdate(oldState, newState);

      logger.debug('🎭 Événement VoiceStateUpdate traité', {
        guildId: newState.guild.id,
        userId: newState.member?.id,
        oldChannel: oldState.channelId,
        newChannel: newState.channelId
      });
    } catch (error) {
      logger.error('Erreur lors du traitement de VoiceStateUpdate:', error);
    }
  }
};
