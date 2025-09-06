// ========================================
// bot/events/handlers/SpecialCommandHandler.js - Gestion des commandes spéciales
// ========================================

import logger from '../../logger.js';
import stageMonitor from '../../../core/services/StageMonitor.js';
import stageSpeakerManager from '../../../core/services/StageSpeakerManager.js';

/**
 * Gérer les commandes spéciales qui nécessitent deferReply
 */
export async function handleSpecialCommands (interaction, result, commandName) {
  // Traitement spécial pour la commande play
  if (result.message === 'PLAY_COMMAND') {
    logger.info(`Traitement de la commande ${commandName}`);
    await handlePlayCommand(interaction);
    return;
  }

  // Traitement spécial pour la commande schedule
  if (result.message === 'SCHEDULE_COMMAND') {
    logger.info('Traitement de la commande SCHEDULE_COMMAND');
    await handleScheduleCommand(interaction, result);
  }
}

/**
 * Traiter la commande play
 */
async function handlePlayCommand (interaction) {
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

    const config = (await import('../../config.js')).default;
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

    // 🎭 Enregistrer le stage pour surveillance automatique
    stageMonitor.registerStage(channel.guild.id, channel.id);
    logger.info('🎭 Stage enregistré pour surveillance automatique');

    // 🔁 Sécurité si le stream prend trop de temps
    const timeout = setTimeout(() => {
      logger.warn('⏰ Timeout de 5s atteint');
      interaction.editReply('⚠️ Aucun son détecté après 5s. Lecture échouée ?');
    }, 5000);

    player.once(AudioPlayerStatus.Playing, async () => {
      logger.info('🎵 Événement Playing détecté');
      clearTimeout(timeout);

      // 🎤 Tentative d'auto-promotion en speaker
      try {
        const promotionResult = await stageSpeakerManager.promoteToSpeaker(connection, channel);

        if (promotionResult.success) {
          await interaction.editReply('▶️ Stream lancé dans le stage channel. 🎤 Bot promu en speaker automatiquement.');
          logger.success('🎤 Auto-promotion en speaker réussie');
        } else {
          const missingPerms = stageSpeakerManager.formatMissingPermissions(promotionResult.missingPermissions || []);
          const errorMessage = missingPerms.length > 0
            ? `Permissions manquantes: ${missingPerms.join(', ')}`
            : '';
          await interaction.editReply(
            '▶️ Stream lancé dans le stage channel.\n⚠️ Auto-promotion en speaker échouée: '
            + `${promotionResult.message}\n${errorMessage}`
          );
          logger.warn('🎤 Auto-promotion en speaker échouée:', promotionResult.message);
        }
      } catch (promotionError) {
        await interaction.editReply(
          '▶️ Stream lancé dans le stage channel.\n⚠️ Erreur lors de l\'auto-promotion en speaker.'
        );
        logger.error('🎤 Erreur lors de l\'auto-promotion:', promotionError);
      }

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
 * Traiter la commande schedule
 */
async function handleScheduleCommand (interaction, _result) {
  try {
    // Import dynamique de la commande schedule
    const scheduleCommand = await import('../../commands/schedule.js');
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
