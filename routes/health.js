// routes/health.js
import { Router } from "express";

export default (client, logger) => {
  const router = Router();

  router.get("/", (req, res) => {
    logger.info("✅ Healthcheck ping reçu");

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      message: "🟢 soundSHINE API is up and running!",
      bot: {
        username: client?.user?.tag ?? "unknown",
        readyAt: client?.readyAt ?? null,
      },
    });
  });

  return router;
};
