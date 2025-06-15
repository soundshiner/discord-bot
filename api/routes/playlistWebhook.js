import { Router } from "express";
import config from "../../core/config.js";

const { VOICE_CHANNEL_ID, API_TOKEN, PLAYLIST_CHANNEL_ID } = config;

export default (client, logger) => {
  const router = Router();

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

    try {
      // 1. Envoi de l'embed de playlist
      const playlistChannel = client.channels.cache.get(PLAYLIST_CHANNEL_ID);
      if (!playlistChannel?.isTextBased()) {
        return res
          .status(500)
          .json({ error: "Canal Discord invalide pour la playlist." });
      }

      const embed = {
        title: "Nouvelle Playlist en cours",
        description: `**${playlist}** est maintenant en rotation sur soundSHINE!`,
        color: 0xaff6e4,
        footer: {
          text: "soundSHINE Radio",
        },
        thumbnail: {
          url: "https://soundshineradio.com/avatar.jpg",
        },
      };

      await playlistChannel.send({ embeds: [embed] });
      logger.success(`Embed playlist envoyé : ${playlist}`);

      // 2. Mise à jour du stage channel
      const stageChannel = await client.channels.fetch(VOICE_CHANNEL_ID);
      if (!stageChannel || stageChannel.type !== 13) {
        return res.status(400).json({ error: "Canal Stage invalide." });
      }

      const stageInstance = stageChannel.stageInstance;

      if (!stageInstance) {
        logger.info(
          "[Webhook] Aucune instance active, tentative de création..."
        );
        try {
          await stageChannel.createStageInstance({ topic });
          logger.success(`[Webhook] Instance créée avec sujet: ${topic}`);
        } catch (createErr) {
          logger.error(`[Webhook] Échec de la création: ${createErr}`);
          return res
            .status(500)
            .json({ error: "Impossible de créer une instance de stage." });
        }
      } else {
        await stageInstance.edit({ topic });
        logger.success(`[Webhook] Sujet modifié: ${topic}`);
      }

      return res.status(200).json({
        status: "OK",
        message: "Playlist et stage mis à jour avec succès.",
        playlist,
        topic,
      });
    } catch (err) {
      logger.error(`Erreur serveur: ${err.message}`);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  logger.custom("ROUTE", "✅ Route /v1/send-playlist chargée");

  return router;
};
