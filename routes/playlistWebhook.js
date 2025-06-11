// routes/playlistWebhook.js
import { Router } from "express";

export default function playlistWebhook(client, logger) {
  const router = Router();

  router.get("/sendplaylist", async (req, res) => {
    const playlist = req.query.name || "Playlist inconnue";

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

    try {
      const channel = client.channels.cache.get(
        process.env.PLAYLIST_CHANNEL_ID
      );
      if (!channel || !channel.isTextBased()) {
        return res.status(500).json({ error: "Canal Discord invalide." });
      }

      await channel.send({ embeds: [embed] });
      logger.success(`Embed playlist envoyé : ${playlist}`);
      return res.json({ status: "OK", sent: true });
    } catch (err) {
      logger.error(`Erreur embed playlist : ${err.message}`);
      return res
        .status(500)
        .json({ error: "Erreur lors de l’envoi de l’embed" });
    }
  });

  return router;
}
