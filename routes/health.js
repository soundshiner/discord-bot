// ========================================
// routes/health.js
// ========================================

import { Router } from "express";

export default (client, logger) => {
  const router = Router();

  router.get("/", (req, res) => {
    res.json({ status: "healthy", bot: client.user?.tag });
  });

  logger.custom("ROUTE", "✅ Route /v1/health chargée");

  return router;
};
