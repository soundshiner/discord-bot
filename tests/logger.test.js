import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import logger from '../utils/logger.js';
import chalk from 'chalk';

// Mock Winston
vi.mock('winston', () => ({
  default: {
    createLogger: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })),
    format: {
      printf: vi.fn(),
      combine: vi.fn(),
      colorize: vi.fn(),
      timestamp: vi.fn(),
      simple: vi.fn()
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn()
    }
  }
}));

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    chalk.level = 0; // Disable chalk colors for testing
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have all required methods', () => {
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('success');
    expect(logger).toHaveProperty('custom');
    expect(logger).toHaveProperty('section');
  });

  it('should log error messages with custom format', () => {
    const message = 'Test error message';
    logger.error(message);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      '[✖ ERREUR ] Test error message'
    );
  });

  it('should log warning messages with custom format', () => {
    const message = 'Test warning message';
    logger.warn(message);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      '[ ⚠ AVERTISSEMENT ] Test warning message'
    );
  });

  it('should log success messages with custom format', () => {
    const message = 'Test success message';
    logger.success(message);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      '[✔ SUCCÈS ] Test success message'
    );
  });

  it('should log custom messages with prefix', () => {
    const prefix = 'CUSTOM';
    const message = 'Test custom message';
    logger.custom(prefix, message);
    expect(consoleSpy.log).toHaveBeenCalledWith(
      '[ CUSTOM ] Test custom message'
    );
  });

  it('should log section headers', () => {
    const sectionName = 'Test Section';
    logger.section(sectionName);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(
        '══════════════════════════════════════════════════'
      )
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(sectionName)
    );
  });

  it('should log section start headers', () => {
    const sectionName = 'Test Section Start';
    logger.sectionStart(sectionName);

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining('═'.repeat(50))
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(sectionName)
    );
  });

  it('should log infocmd messages', () => {
    const message = 'Test CMD message';
    logger.infocmd(message);
    expect(consoleSpy.log).toHaveBeenCalledWith('[📡 CMD ] : Test CMD message');
  });
});

