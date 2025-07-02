// ========================================
// tests/setup.js - Configuration d'environnement de test (sans jest)
// ========================================

// Mock des variables d'environnement de test
// process.env.NODE_ENV = 'test';
// process.env.BOT_TOKEN = 'test-token';
// process.env.API_PORT = '3001';
// process.env.JSON_URL = 'http://localhost:8000/status-json.xsl';
// process.env.VOICE_CHANNEL_ID = '123456789';
// process.env.API_TOKEN = 'test-api-token';
// process.env.PLAYLIST_CHANNEL_ID = '987654321';
// process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Helpers purs (pas de jest ici)
global.testUtils = {
  // Créer un mock d'interaction Discord
  createMockInteraction: (options = {}) => ({
    isCommand: () => options.isCommand || false,
    isStringSelectMenu: () => options.isStringSelectMenu || false,
    commandName: options.commandName || 'test',
    customId: options.customId || 'test',
    values: options.values || [],
    user: {
      tag: options.userTag || 'TestUser#1234',
      id: options.userId || '123456789'
    },
    reply: async () => {},
    editReply: async () => {},
    update: async () => {},
    replied: options.replied || false,
    deferred: options.deferred || false,
    client: {
      commands: new Map()
    }
  }),

  // Créer un mock de message Discord
  createMockMessage: (options = {}) => ({
    content: options.content || '!test',
    author: {
      tag: options.authorTag || 'TestUser#1234',
      bot: options.isBot || false
    },
    createdTimestamp: Date.now(),
    reply: async () => {},
    client: {
      commands: new Map(),
      user: { id: 'bot-id' }
    },
    channel: {
      messages: {
        fetch: async () => ({
          author: { id: 'bot-id' }
        })
      }
    },
    reference: options.reference || null
  }),

  // Créer un mock de requête Express
  createMockRequest: (options = {}) => ({
    method: options.method || 'GET',
    url: options.url || '/test',
    path: options.path || '/test',
    ip: options.ip || '127.0.0.1',
    body: options.body || {},
    headers: options.headers || {},
    get: header => options.headers?.[header] || '',
    originalUrl: options.originalUrl || '/test'
  }),

  // Créer un mock de réponse Express
  createMockResponse: () => {
    const res = {};
    res.status = () => res;
    res.json = () => res;
    res.send = () => res;
    res.end = () => res;
    return res;
  }
};
