// routes/health.js
import { Router } from "express";

export default (client, logger) => {
  const router = Router();

  router.get("/", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  return router;
};
