// routes/presence.js
import express from "express";
import { startPresence } from "../../utils/presence.js"; // adapte selon le chemin réel

export default function presenceRoutes(client, logger) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const { title = "soundSHINE Radio", type = "listening" } = req.query;

    try {
      startPresence(title, type.toLowerCase());
      res.status(200).json({
        success: true,
        message: `Présence mise à jour avec le titre : ${title}`
      });
    } catch (err) {
      logger.error("Erreur mise à jour présence Discord :", err);
      res.status(500).json({
        success: false,
        error: "Impossible de mettre à jour le statut Discord."
      });
    }
  });

  return router;
}
