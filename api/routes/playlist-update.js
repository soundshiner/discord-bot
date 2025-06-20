import express from "express";
import config from "../../core/config.js";
const { VOICE_CHANNEL_ID, API_TOKEN, PLAYLIST_CHANNEL_ID } = config;

export default (client, logger) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    logger.info("POST /v1/send-playlist");
    const { token, playlist, topic } = req.body;

    // Vérification du token
    if (!token || token !== API_TOKEN) {
      return res.status(403).json({ error: "Token invalide." });
    }

    // Vérification des paramètres requis
    if (!playlist || !topic) {
      return res.status(400).json({ error: "Playlist et topic sont requis." });
    }

    let playlistSent = false;
    let stageTopic = false;

    try {
      logger.info("=== DÉBUT DU TRAITEMENT ===");

      // 1. Envoi de l'embed de playlist
      logger.info("🔄 Étape 1: Récupération du canal playlist...");
      const playlistChannel = client.channels.cache.get(PLAYLIST_CHANNEL_ID);

      if (!playlistChannel?.isTextBased()) {
        logger.error("❌ Canal playlist introuvable ou invalide");
        return res
          .status(500)
          .json({ error: "Canal Discord invalide pour la playlist." });
      }

      logger.info(`✅ Canal playlist trouvé: ${playlistChannel.name}`);

      const embed = {
        title: "Nouvelle Playlist en cours",
        description: `**${playlist}** est maintenant en rotation sur soundSHINE! Vous pouvez l'écouter en direct sur le canal <#1383684854255849613>.`,
        color: 0xaff6e4,
        footer: {
          text: "soundSHINE Radio | https://soundshineradio.com",
          icon_url: "https://soundshineradio.com/avatar.jpg",
        },
      };

      logger.info("🔄 Étape 2: Tentative d'envoi de l'embed...");
      try {
        await playlistChannel.send({ embeds: [embed] });
        logger.success("✅ Embed playlist envoyé avec succès");
        playlistSent = true;
      } catch (embedErr) {
        logger.error(
          `❌ Erreur lors de l'envoi de l'embed: ${embedErr.message}`
        );
        logger.error(`Code d'erreur embed: ${embedErr.code}`);
        // Continue quand même pour tester le stage channel
      }

      // 2. Mise à jour du stage channel
      logger.info("🔄 Étape 3: Récupération du stage channel...");
      try {
        const stageChannel = await client.channels.fetch(VOICE_CHANNEL_ID);

        if (!stageChannel || stageChannel.type !== 13) {
          logger.error(
            `❌ Stage channel invalide. Type: ${stageChannel?.type}, ID: ${VOICE_CHANNEL_ID}`
          );
          throw new Error("Canal Stage invalide");
        }

        logger.info(`✅ Stage channel trouvé: ${stageChannel.name}`);

        logger.info("🔄 Étape 4: Vérification de l'instance de stage...");
        const stageInstance = stageChannel.stageInstance;

        if (!stageInstance) {
          logger.info(
            "🔄 Étape 5a: Aucune instance active, création en cours..."
          );
          try {
            await stageChannel.createStageInstance({ topic });
            logger.success(`✅ Instance de stage créée avec sujet: ${topic}`);
            stageTopic = true;
          } catch (createErr) {
            logger.error(`❌ Erreur lors de la création: ${createErr.message}`);
            logger.error(`Code d'erreur création: ${createErr.code}`);
            throw createErr;
          }
        } else {
          logger.info(
            "🔄 Étape 5b: Instance existante, modification du sujet..."
          );
          try {
            await stageInstance.edit({ topic });
            logger.success(`✅ Sujet modifié: ${topic}`);
            stageTopic = true;
          } catch (editErr) {
            logger.error(
              `❌ Erreur lors de la modification: ${editErr.message}`
            );
            logger.error(`Code d'erreur modification: ${editErr.code}`);
            throw editErr;
          }
        }
      } catch (stageErr) {
        logger.error(`❌ Erreur générale stage channel: ${stageErr.message}`);
        logger.error(`Code d'erreur stage: ${stageErr.code}`);

        // Si au moins l'embed a fonctionné, on peut continuer
        if (playlistSent) {
          logger.info("⚠️ Embed envoyé mais stage channel échoué");
          return res.status(200).json({
            status: "PARTIAL",
            message: "Playlist envoyée mais échec du stage channel.",
            playlist,
            topic,
            details: {
              playlistSent: true,
              stageTopic: false,
              error: stageErr.message,
            },
          });
        } else {
          throw stageErr;
        }
      }

      logger.info("=== TRAITEMENT TERMINÉ AVEC SUCCÈS ===");
      return res.status(200).json({
        status: "OK",
        message: "Playlist et stage mis à jour avec succès.",
        playlist,
        topic,
        details: {
          playlistSent,
          stageTopic,
        },
      });
    } catch (err) {
      logger.error(`❌ ERREUR FATALE: ${err.message}`);
      logger.error(`Code: ${err.code}`);
      logger.error(`Stack: ${err.stack}`);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  logger.custom("ROUTE", "✅ Route /v1/send-playlist chargée");
  return router;
};
