import express from "express";
import config from "../../core/config.js";
import { z } from "zod";
const { VOICE_CHANNEL_ID, API_TOKEN, PLAYLIST_CHANNEL_ID } = config;

const playlistSchema = z.object({
  playlist: z.string().min(1, "Playlist is required"),
  topic: z.string().min(1, "Topic is required"),
});

export default (client, logger) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
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

      let playlistSent = false;
      let stageTopic = false;

      // 1. Envoi de l'embed de playlist
      const playlistChannel = client.channels.cache.get(PLAYLIST_CHANNEL_ID);

      if (!playlistChannel?.isTextBased()) {
        return res
          .status(500)
          .json({ error: "Canal Discord invalide pour la playlist." });
      }

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

      try {
        await playlistChannel.send({ embeds: [embed] });
        playlistSent = true;
      } catch (embedErr) {
        // Continue quand même pour tester le stage channel
      }

      // 2. Mise à jour du stage channel
      try {
        const stageChannel = await client.channels.fetch(VOICE_CHANNEL_ID);

        if (!stageChannel || stageChannel.type !== 13) {
          throw new Error("Canal Stage invalide");
        }

        const { stageInstance } = stageChannel;

        if (!stageInstance) {
          try {
            await stageChannel.createStageInstance({ topic });
            stageTopic = true;
          } catch (createErr) {
            throw createErr;
          }
        } else {
          try {
            await stageInstance.edit({ topic });
            stageTopic = true;
          } catch (editErr) {
            throw editErr;
          }
        }
      } catch (stageErr) {
        // Si au moins l'embed a fonctionné, on peut continuer
        if (playlistSent) {
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
      return res
        .status(500)
        .json({ error: "Erreur serveur lors du traitement." });
    }
  });

  return router;
};

