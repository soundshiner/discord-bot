// routes/stageWebhook.js
import { Router } from "express";
import config from "../core/config.js";

const { VOICE_CHANNEL_ID: channelId, WEBHOOK_API_TOKEN } = config;

export default function stageWebhook(client, logger) {
  const router = Router();

  router.get("/stage-topic", async (req, res) => {
    const { token, topic } = req.query;

    if (!token || !topic) {
      return res.status(400).json({ error: "Token et topic sont requis." });
    }

    if (token !== WEBHOOK_API_TOKEN) {
      return res.status(403).json({ error: "Token invalide." });
    }

    logger.info(
      `[Webhook] Reçu demande de changement de sujet sur le Stage ${channelId} → "${topic}"`
    );

    try {
      const stageChannel = await client.channels.fetch(channelId);

      if (!stageChannel || stageChannel.type !== 13) {
        return res
          .status(400)
          .json({ error: "Ce canal n'est pas un Stage Channel valide." });
      }

      const stageInstance = stageChannel.stageInstance;

      if (!stageInstance) {
        logger.info(
          `[Webhook] Aucune instance active, tentative de création...`
        );
        try {
          await stageChannel.createStageInstance({ topic });
          logger.success(`[Webhook] Instance créée avec sujet: ${topic}`);
          return res
            .status(201)
            .json({ message: "Instance créée avec le sujet fourni." });
        } catch (createErr) {
          logger.error(`[Webhook] Échec de la création: ${createErr}`);
          return res
            .status(500)
            .json({ error: "Impossible de créer une instance de stage." });
        }
      } else {
        await stageInstance.edit({ topic });
        logger.success(`[Webhook] Sujet modifié: ${topic}`);
        return res
          .status(200)
          .json({ message: "Sujet de l'instance mis à jour." });
      }
    } catch (err) {
      logger.error(`[Webhook] Erreur serveur: ${err}`);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  return router;
}
