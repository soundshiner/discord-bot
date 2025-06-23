import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../utils/errorHandler.js';

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

let errorHandler;

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = new ErrorHandler(mockLogger);
  });

  it('should have all required methods', () => {
    expect(errorHandler).toHaveProperty('handleCommandError');
    expect(errorHandler).toHaveProperty('handleApiError');
    expect(errorHandler).toHaveProperty('handleCriticalError');
    expect(errorHandler).toHaveProperty('categorizeError');
    expect(errorHandler).toHaveProperty('getUserFriendlyMessage');
    expect(errorHandler).toHaveProperty('getHttpStatusCode');
  });

  it('should handle command errors', async () => {
    const error = new Error('Test command error');
    const mockInteraction = {
      commandName: 'test',
      reply: vi.fn().mockResolvedValue(true),
      replied: false,
      deferred: false
    };

    await errorHandler.handleCommandError(error, mockInteraction);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Test command error'));
    expect(mockInteraction.reply).toHaveBeenCalled();
  });

  it('should handle API errors', () => {
    const error = new Error('Test API error');
    const mockReq = { method: 'GET', path: '/test' };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    errorHandler.handleApiError(error, mockReq, mockRes);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Test API error'));
    expect(mockRes.status).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should handle critical errors', () => {
    const error = new Error('Test critical error');
    const context = 'test-context';

    errorHandler.handleCriticalError(error, context);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Test critical error'));
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining(context));
  });

  it('should categorize errors correctly', () => {
    const networkError = new Error('Connection refused');
    networkError.code = 'ECONNREFUSED';
    const permissionError = new Error('Insufficient permissions');

    expect(errorHandler.categorizeError(networkError)).toBe('NETWORK');
    expect(errorHandler.categorizeError(permissionError)).toBe('PERMISSION');
  });

  it('should return user-friendly messages', () => {
    expect(errorHandler.getUserFriendlyMessage('NETWORK')).toBe(
      'Problème de connexion. Réessayez dans quelques instants.'
    );
    expect(errorHandler.getUserFriendlyMessage('PERMISSION')).toBe('Permissions insuffisantes pour cette action.');
  });

  it('should return correct HTTP status codes', () => {
    expect(errorHandler.getHttpStatusCode('NETWORK')).toBe(503);
    expect(errorHandler.getHttpStatusCode('PERMISSION')).toBe(403);
    expect(errorHandler.getHttpStatusCode('AUTH')).toBe(401);
  });
});
