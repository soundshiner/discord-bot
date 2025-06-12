import { Router } from "express"; // 👈 Il manquait cette ligne

export default (client, logger) => {
  const router = Router();

  logger.custom("ROUTE", "✅ Route /v1/health chargée", "green");

  router.get("/", (req, res) => {
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
