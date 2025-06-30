// api/routes.js

import healthRoutes from './routes/health.js';
import metricsRoutes from './routes/metrics.js';
import playlistRoutes from './routes/playlist-update.js';
import logsRoutes from './routes/logs.js';
import alertsRoutes from './routes/alerts.js';

export default function loadRoutes (app, client, logger) {
  app.get('/', (req, res) => {
    res.json({
      name: 'soundSHINE Bot API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/v1/health',
        metrics: '/v1/metrics',
        logs: '/v1/logs',
        alerts: '/v1/alerts',
        playlist: '/v1/send-playlist'
      }
    });
  });

  app.use('/v1/health', healthRoutes(client, logger));
  app.use('/v1/metrics', metricsRoutes(client, logger));
  app.use('/v1/logs', logsRoutes(client, logger));
  app.use('/v1/alerts', alertsRoutes(client, logger));
  app.use('/v1/send-playlist', playlistRoutes(client, logger));

  // 404
  app.use((req, res) => {
    res.status(404).json({
      error: 'Route non trouvée',
      path: req.originalUrl,
      method: req.method
    });
  });
}
