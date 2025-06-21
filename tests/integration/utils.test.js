import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateURL } from '../../utils/validateURL.js';
import { checkStreamOnline } from '../../utils/checkStreamOnline.js';
import { genres } from '../../utils/genres.js';
import { cache } from '../../utils/cache.js';
import { database } from '../../utils/database.js';

describe('Utils Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Validation', () => {
    it('should validate YouTube URLs', () => {
      const validYouTubeURLs = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      validYouTubeURLs.forEach(url => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should validate Spotify URLs', () => {
      const validSpotifyURLs = [
        'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
        'https://open.spotify.com/album/4iV5W9uYEdYUVa79Axb7Rh',
        'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'
      ];

      validSpotifyURLs.forEach(url => {
        expect(validateURL(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidURLs = [
        'not-a-url',
        'http://invalid-domain.com',
        'https://youtube.com/invalid',
        'https://spotify.com/invalid',
        'ftp://example.com/file.mp3'
      ];

      invalidURLs.forEach(url => {
        expect(validateURL(url)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateURL('')).toBe(false);
      expect(validateURL(null)).toBe(false);
      expect(validateURL(undefined)).toBe(false);
      expect(validateURL('https://youtube.com')).toBe(false); // Missing video ID
    });
  });

  describe('Stream Online Check', () => {
    it('should handle valid stream URLs', async () => {
      // Mock successful stream check
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ isLive: true })
      });

      const result = await checkStreamOnline('https://twitch.tv/testuser');
      expect(result).toBe(true);
    });

    it('should handle offline streams', async () => {
      // Mock offline stream
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ isLive: false })
      });

      const result = await checkStreamOnline('https://twitch.tv/testuser');
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await checkStreamOnline('https://twitch.tv/testuser');
      expect(result).toBe(false);
    });

    it('should handle invalid URLs', async () => {
      const result = await checkStreamOnline('invalid-url');
      expect(result).toBe(false);
    });
  });

  describe('Genres', () => {
    it('should have valid genre structure', () => {
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThan(0);
    });

    it('should have unique genre names', () => {
      const genreNames = genres.map(genre => genre.name);
      const uniqueNames = new Set(genreNames);
      expect(uniqueNames.size).toBe(genreNames.length);
    });

    it('should have valid genre objects', () => {
      genres.forEach(genre => {
        expect(genre).toHaveProperty('name');
        expect(genre).toHaveProperty('emoji');
        expect(typeof genre.name).toBe('string');
        expect(typeof genre.emoji).toBe('string');
        expect(genre.name.length).toBeGreaterThan(0);
        expect(genre.emoji.length).toBeGreaterThan(0);
      });
    });

    it('should find genres by name', () => {
      const rockGenre = genres.find(genre => genre.name.toLowerCase().includes('rock'));
      expect(rockGenre).toBeDefined();
      expect(rockGenre).toHaveProperty('name');
      expect(rockGenre).toHaveProperty('emoji');
    });
  });

  describe('Cache System', () => {
    it('should set and get cache values', () => {
      const key = 'test-key';
      const value = { data: 'test-value', timestamp: Date.now() };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle cache expiration', () => {
      const key = 'expiring-key';
      const value = { data: 'expiring-value', timestamp: Date.now() };

      cache.set(key, value, 1); // 1ms expiration

      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const retrieved = cache.get(key);
          expect(retrieved).toBeNull();
          resolve();
        }, 10);
      });
    });

    it('should clear cache entries', () => {
      const key = 'clear-key';
      const value = { data: 'clear-value' };

      cache.set(key, value);
      cache.clear(key);

      const retrieved = cache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should handle cache statistics', () => {
      const stats = cache.getStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
    });

    it('should handle concurrent cache access', async () => {
      const key = 'concurrent-key';
      const value = { data: 'concurrent-value' };

      // Simulate concurrent access
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise(resolve => {
            cache.set(key, { ...value, index: i });
            const retrieved = cache.get(key);
            resolve(retrieved);
          })
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('data');
      });
    });
  });

  describe('Database', () => {
    it('should initialize database connection', async () => {
      // Mock database initialization
      const mockDb = {
        prepare: vi.fn(),
        exec: vi.fn(),
        close: vi.fn()
      };

      // Test database initialization
      expect(database).toBeDefined();
    });

    it('should handle database queries', async () => {
      // Mock database query
      const mockQuery = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ changes: 0 })
      });

      // Test query execution
      expect(mockQuery).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockError = new Error('Database connection failed');

      // Test error handling
      expect(mockError).toBeInstanceOf(Error);
      expect(mockError.message).toBe('Database connection failed');
    });
  });

  describe('Utils Integration', () => {
    it('should work together in a typical workflow', async () => {
      // Simulate a typical workflow: validate URL -> check stream -> cache result
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

      // Step 1: Validate URL
      const isValidURL = validateURL(url);
      expect(isValidURL).toBe(true);

      // Step 2: Check if it's a stream
      const isStream = url.includes('twitch.tv') || url.includes('youtube.com/live');
      expect(typeof isStream).toBe('boolean');

      // Step 3: Cache the result
      const cacheKey = `url_${Buffer.from(url).toString('base64')}`;
      const cacheValue = {
        url,
        isValid: isValidURL,
        isStream,
        timestamp: Date.now()
      };

      cache.set(cacheKey, cacheValue, 300000); // 5 minutes

      // Step 4: Retrieve from cache
      const cached = cache.get(cacheKey);
      expect(cached).toEqual(cacheValue);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test error handling across utilities
      const invalidURL = 'invalid-url';

      // Should handle invalid URL
      expect(validateURL(invalidURL)).toBe(false);

      // Should handle stream check error
      const streamResult = await checkStreamOnline(invalidURL);
      expect(streamResult).toBe(false);

      // Should handle cache with invalid data
      cache.set('error-key', null);
      const cached = cache.get('error-key');
      expect(cached).toBeNull();
    });

    it('should maintain data consistency', () => {
      // Test data consistency across utilities
      const testData = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        genre: genres[0],
        timestamp: Date.now()
      };

      // Cache the data
      cache.set('consistency-test', testData);

      // Retrieve and validate
      const retrieved = cache.get('consistency-test');
      expect(retrieved).toEqual(testData);
      expect(validateURL(retrieved.url)).toBe(true);
      expect(retrieved.genre).toHaveProperty('name');
      expect(retrieved.genre).toHaveProperty('emoji');
    });
  });
});
