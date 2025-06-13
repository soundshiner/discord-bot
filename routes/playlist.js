// ========================================
// routes/playlist.js
// ========================================

import { Router } from "express";

export default (client, logger) => {
  const router = Router();

  router.post("/", async (req, res) => {
    const { metadata, textChannelId } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: "Paramètre 'metadata' manquant" });
    }
    if (!textChannelId) {
      return res
        .status(400)
        .json({ error: "Paramètre 'textChannelId' manquant" });
    }

    try {
      // Changer le nom ou le topic d'un salon
      const textChannel = client.channels.cache.get(textChannelId);
      if (textChannel) {
        await textChannel.setTopic(`🎵 Playlist en cours : ${metadata.title}`);
        logger.info(`[WEBHOOK] Playlist mise à jours : ${metadata.title}`);
      } else {
        logger.error(`[WEBHOOK] Canal ${textChannelId} introuvable`);
      }

      res.json({ success: true });
    } catch (err) {
      logger.error(`[WEBHOOK] Erreur traitement playlist : ${err.message}`);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  logger.custom("ROUTE", "✅ Route /v1/playlist chargée");

  return router;
};
