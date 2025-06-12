// routes/health.js
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: "🟢 soundSHINE API is up and running!",
  });
});

export default router;
