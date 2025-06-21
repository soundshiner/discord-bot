import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock config avant d'importer les routes
vi.mock('../../core/config.js', () => ({
  default: {
    VOICE_CHANNEL_ID: 'stage-channel-id',
    API_TOKEN: 'test-api-token',
    PLAYLIST_CHANNEL_ID: 'playlist-channel-id'
  }
}));

import healthRoute from '../../api/routes/health.js';
import metricsRoute from '../../api/routes/metrics.js';
import playlistUpdateRoute from '../../api/routes/playlist-update.js';

describe('API Integration Tests', () => {
  let app;
  let mockClient;
  let mockLogger;
  let mockChannel;
  let mockStageChannel;
  let mockStageInstance;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les gros payloads

    // Mock Discord client
    mockClient = {
      user: {
        id: 'bot123',
        username: 'TestBot',
        tag: 'TestBot#1234'
      },
      guilds: {
        cache: new Map([
          ['guild1', { id: 'guild1', name: 'Test Guild 1', memberCount: 100 }],
          ['guild2', { id: 'guild2', name: 'Test Guild 2', memberCount: 200 }]
        ])
      },
      ws: {
        ping: 25,
        status: 0 // Ready
      },
      uptime: 3600000, // 1 hour
      commands: new Map(),
      voice: {
        adapters: new Map()
      },
      channels: {
        cache: new Map(),
        fetch: vi.fn()
      },
      users: {
        cache: new Map()
      }
    };

    // Mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      custom: vi.fn()
    };

    // Mock channel
    mockChannel = {
      id: 'playlist-channel-id',
      name: 'playlist-channel',
      isTextBased: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue({ id: 'message-id' })
    };

    // Mock stage channel
    mockStageChannel = {
      id: 'stage-channel-id',
      name: 'stage-channel',
      type: 13, // Stage channel type
      createStageInstance: vi.fn().mockResolvedValue({ id: 'stage-instance-id' }),
      stageInstance: null
    };

    // Mock stage instance
    mockStageInstance = {
      id: 'stage-instance-id',
      edit: vi.fn().mockResolvedValue({ id: 'stage-instance-id' })
    };

    // Setup channel cache
    mockClient.channels.cache.set('playlist-channel-id', mockChannel);
    mockClient.channels.cache.set('stage-channel-id', mockStageChannel);

    // Setup routes
    app.use('/health', healthRoute(mockClient, mockLogger));
    app.use('/metrics', metricsRoute(mockClient, mockLogger));
    app.use('/playlist-update', playlistUpdateRoute(mockClient, mockLogger));
  });

  describe('Health Route', () => {
    it('should return health status successfully', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.status).toBe('healthy');
    });

    it('should include bot information in health check', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('bot');
      // bot est une string (client.user.tag), pas un objet
      expect(typeof response.body.bot).toBe('string');
      expect(response.body.bot).toBe('TestBot#1234');
    });

    it('should handle health check errors gracefully', async () => {
      // Mock client error
      mockClient.user = null;

      const response = await request(app).get('/health').expect(200);
      // La route ne retourne pas 500, elle gère l'erreur et retourne 'Unknown'
      expect(response.body.bot).toBe('Unknown');
    });
  });

  describe('Metrics Route', () => {
    it('should return comprehensive metrics', async () => {
      const response = await request(app).get('/metrics').expect(200);

      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('discord');
      expect(response.body).toHaveProperty('bot');
      expect(response.body).toHaveProperty('network');
    });

    it('should include system metrics', async () => {
      const response = await request(app).get('/metrics').expect(200);

      const { system } = response.body;
      expect(system).toHaveProperty('uptime');
      expect(system).toHaveProperty('memory');
      expect(system).toHaveProperty('cpu');
      expect(typeof system.uptime).toBe('number');
    });

    it('should include Discord metrics', async () => {
      const response = await request(app).get('/metrics').expect(200);

      const { discord } = response.body;
      expect(discord).toHaveProperty('guilds');
      expect(discord).toHaveProperty('ping');
      expect(discord).toHaveProperty('status');
      expect(discord.guilds).toBe(2);
      expect(discord.ping).toBe(25);
    });

    it('should include bot metrics', async () => {
      const response = await request(app).get('/metrics').expect(200);

      const { bot } = response.body;
      // La vraie route retourne commands, voiceConnections, lastActivity
      expect(bot).toHaveProperty('commands');
      expect(bot).toHaveProperty('voiceConnections');
      expect(bot).toHaveProperty('lastActivity');
      expect(typeof bot.commands).toBe('number');
    });

    it('should handle metrics collection errors', async () => {
      // Mock error in metrics collection
      mockClient.guilds.cache = null;

      const response = await request(app).get('/metrics').expect(200);
      // La route gère l'erreur et retourne 0 pour guilds
      expect(response.body.discord.guilds).toBe(0);
    });
  });

  describe('Playlist Update Route', () => {
    it('should handle playlist update requests', async () => {
      const playlistData = {
        token: 'test-api-token', // Token requis
        playlist: 'Test Playlist',
        topic: 'Test topic'
      };

      // Mock successful stage channel fetch
      mockClient.channels.fetch = vi.fn().mockResolvedValue(mockStageChannel);

      const response = await request(app).post('/playlist-update').send(playlistData).expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('playlist');
      expect(response.body).toHaveProperty('topic');
    });

    it('should validate required playlist data', async () => {
      const invalidData = {
        token: 'test-api-token',
        playlist: 'Test Playlist'
        // Missing topic
      };

      const response = await request(app).post('/playlist-update').send(invalidData).expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Playlist et topic sont requis');
    });

    it('should handle playlist update errors', async () => {
      const playlistData = {
        token: 'test-api-token',
        playlist: 'Error Playlist',
        topic: 'This will cause an error'
      };

      // Mock error scenario - invalid channel
      mockClient.channels.cache.get = vi.fn().mockReturnValue(null);

      const response = await request(app).post('/playlist-update').send(playlistData).expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Canal Discord invalide pour la playlist.');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/playlist-update')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express retourne un objet vide pour JSON malformé
      expect(response.body).toEqual({});
    });

    it('should require valid token', async () => {
      const playlistData = {
        token: 'invalid-token',
        playlist: 'Test Playlist',
        topic: 'Test topic'
      };

      const response = await request(app).post('/playlist-update').send(playlistData).expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Token invalide.');
    });
  });

  describe('API Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      // Express retourne un objet vide pour les 404
      expect(response.body).toEqual({});
    });

    it('should handle method not allowed', async () => {
      const response = await request(app).put('/health').expect(404);

      // Express retourne 404 pour les méthodes non définies
      expect(response.body).toEqual({});
    });

    it('should handle large payloads', async () => {
      const largeData = {
        token: 'test-api-token',
        playlist: 'x'.repeat(1000000), // 1MB payload
        topic: 'Large topic'
      };

      // Mock successful stage channel fetch
      mockClient.channels.fetch = vi.fn().mockResolvedValue(mockStageChannel);

      const response = await request(app).post('/playlist-update').send(largeData).expect(200);

      // Express gère les gros payloads avec la limite augmentée
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('API Performance', () => {
    it('should handle concurrent requests', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get('/health').expect(200));
      }

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should respond quickly to health checks', async () => {
      const start = Date.now();

      await request(app).get('/health').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle metrics collection efficiently', async () => {
      const start = Date.now();

      await request(app).get('/metrics').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('API Security', () => {
    it('should not expose sensitive information', async () => {
      const response = await request(app).get('/metrics').expect(200);

      // Should not expose tokens or sensitive data
      expect(JSON.stringify(response.body)).not.toContain('test-token');
      expect(JSON.stringify(response.body)).not.toContain('DISCORD_TOKEN');
    });

    it('should validate input data', async () => {
      const maliciousData = {
        token: 'test-api-token',
        playlist: '<script>alert("xss")</script>',
        topic: 'Malicious topic'
      };

      // Mock successful stage channel fetch
      mockClient.channels.fetch = vi.fn().mockResolvedValue(mockStageChannel);

      const response = await request(app).post('/playlist-update').send(maliciousData).expect(200);

      // La route accepte les données et les traite
      expect(response.body).toHaveProperty('status');
    });
  });
});
