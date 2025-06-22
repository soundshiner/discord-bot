// ========================================
// routes/metrics.js
// ========================================

import { Router } from 'express';
import os from 'os';

export default (client, logger) => {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const startTime = Date.now();

      // Métriques système
      const systemMetrics = {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        },
        cpu: {
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        },
        platform: {
          os: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
          pid: process.pid
        }
      };

      // Métriques Discord
      const discordMetrics = {
        status: client?.user ? 'online' : 'offline',
        ping: client?.ws?.ping || 0,
        guilds: client?.guilds?.cache?.size || 0,
        users: client?.users?.cache?.size || 0,
        channels: client?.channels?.cache?.size || 0,
        uptime: client?.uptime || 0,
        readyAt: client?.readyAt?.toISOString() || null
      };

      // Métriques du bot
      const botMetrics = {
        commands: client?.commands?.size || 0,
        voiceConnections: client?.voice?.adapters?.size || 0,
        lastActivity: new Date().toISOString()
      };

      // Métriques réseau
      const networkMetrics = {
        requestTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      const metrics = {
        system: systemMetrics,
        discord: discordMetrics,
        bot: botMetrics,
        network: networkMetrics
      };

      // Log de l'accès aux métriques
      logger.custom('METRICS', `Métriques demandées par ${req.ip}`, 'cyan');

      res.json(metrics);
    } catch (error) {
      logger.error('Erreur route metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
};
