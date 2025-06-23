import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Reset the module cache to force re-import
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('should load default values when environment variables are not set', async () => {
    delete process.env.DISCORD_TOKEN;
    delete process.env.CLIENT_ID;
    delete process.env.API_PORT;

    // Re-import to get fresh config
    const { config: freshConfig } = await import('../utils/config.js');
    const result = freshConfig();

    expect(result).toEqual({
      token: '',
      clientId: '',
      apiPort: 3000
    });
  });

  it('should load values from environment variables', async () => {
    process.env.DISCORD_TOKEN = 'test-token';
    process.env.CLIENT_ID = 'test-client-id';
    process.env.API_PORT = '8080';

    // Re-import to get fresh config
    const { config: freshConfig } = await import('../utils/config.js');
    const result = freshConfig();

    expect(result).toEqual({
      token: 'test-token',
      clientId: 'test-client-id',
      apiPort: 8080
    });
  });

  it('should handle invalid API_PORT gracefully', async () => {
    process.env.API_PORT = 'invalid';

    // Re-import to get fresh config
    const { config: freshConfig } = await import('../utils/config.js');
    const result = freshConfig();

    expect(result.apiPort).toBe(3000);
  });

  it('should return cached config on subsequent calls', async () => {
    process.env.DISCORD_TOKEN = 'test-token';

    // Re-import to get fresh config
    const { config: freshConfig } = await import('../utils/config.js');
    const result1 = freshConfig();
    const result2 = freshConfig();

    expect(result1).toBe(result2);
  });
});

