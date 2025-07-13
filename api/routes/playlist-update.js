import express from "express";
import botConfig from "../../bot/config.js";
import { z } from "zod";

const { VOICE_CHANNEL_ID, API_TOKEN, PLAYLIST_CHANNEL_ID } = botConfig;

const playlistSchema = z.object({
  playlist: z.string().min(1, "Playlist is required"),
  topic: z.string().min(1, "Topic is required"),
});

// Fonction pour s'assurer que les accents sont correctement encodés
const ensureAccentEncoding = (text) => {
  // S'assurer que le texte est correctement encodé en UTF-8
  // et normalisé pour éviter les problèmes avec Discord
  return text
    .normalize("NFC") // Normalisation Unicode pour s'assurer que les accents sont bien formés
    .trim(); // Supprimer les espaces en début/fin
};

export default (client, logger) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      logger.info("POST /v1/send-playlist");

      // Vérification du token dans le header
      const apiKey = req.headers["x-api-key"];
      if (!apiKey || apiKey !== API_TOKEN) {
        return res.status(403).json({ error: "Invalid or missing API token." });
      }

      // Validation du body avec zod
      const parseResult = playlistSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: parseResult.error.errors,
        });
      }
      const { playlist, topic } = parseResult.data;

      // Normalisation du topic pour gérer les accents
      const normalizedTopic = ensureAccentEncoding(topic);
      logger.info(`Topic original: ${topic}`);
      logger.info(`Topic normalisé: ${normalizedTopic}`);

      let playlistSent = false;
      let stageTopic = false;

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

      const description = `**${playlist}** est maintenant en cours sur soundSHINE! 
      \nVous pouvez l'écouter en direct sur le canal <#1383684854255849613>.`;

      const embed = {
        title: "💿 Nouvelle Session en cours",
        description,
        color: 0xaff6e4,
        footer: {
          text: "https://soundshineradio.com",
          icon_url: "https://soundshineradio.com/avatar.jpg",
        },
      };

      logger.info("🔄 Étape 2: Tentative d'envoi de l'embed...");
      try {
        await playlistChannel.send({ embeds: [embed] });
        logger.info("✅ Embed playlist envoyé avec succès");
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
        const { stageInstance } = stageChannel;

        if (!stageInstance) {
          logger.info(
            "🔄 Étape 5a: Aucune instance active, création en cours..."
          );
          try {
            await stageChannel.createStageInstance({ topic: normalizedTopic });
            logger.info(
              `✅ Instance de stage créée avec sujet: ${normalizedTopic}`
            );
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
            await stageInstance.edit({ topic: normalizedTopic });
            logger.info(`✅ Sujet modifié: ${normalizedTopic}`);
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
            topic: normalizedTopic,
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
        topic: normalizedTopic,
        details: {
          playlistSent,
          stageTopic,
        },
      });
    } catch (err) {
      logger.error(`ERREUR FATALE: ${err.message}`);
      logger.error(`Code: ${err.code}`);
      logger.error(`Stack: ${err.stack}`);
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  return router;
};

