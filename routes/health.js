// routes/health.js
import { Router } from "express";

export default (client, logger) => {
  const router = Router();

  // Correction ici : matcher aussi bien /v1/health que /v1/health/
  router.get("", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      bot: {
        username: client?.user?.tag || null,
        readyAt: client?.readyAt || null,
      },
    });
  });

  return router;
};
