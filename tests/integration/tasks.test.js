import { describe, it, expect, beforeEach, vi } from 'vitest';
import updateStatusTask from '../../tasks/updateStatus.js';

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));
import axios from 'axios';

vi.mock('../../core/config.js', () => ({
  default: {
    JSON_URL: 'http://mock-json-url'
  }
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    success: vi.fn(),
    custom: vi.fn(),
    infocmd: vi.fn()
  }
}));
import logger from '../../utils/logger.js';

vi.mock('../../utils/errorHandler.js', () => ({
  default: {
    handleTaskError: vi.fn()
  }
}));
import errorHandler from '../../utils/errorHandler.js';

vi.mock('discord.js', () => ({
  ActivityType: { Custom: 42, Listening: 2 }
}));

const mockSetActivity = vi.fn();
const mockClient = {
  user: {
    setActivity: mockSetActivity
  }
};

describe('updateStatus task', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('met à jour le status Discord avec la chanson courante', async () => {
    axios.get.mockResolvedValue({
      data: {
        icestats: {
          source: { title: 'Test Song' }
        }
      }
    });

    await updateStatusTask.execute(mockClient);

    expect(axios.get).toHaveBeenCalledWith('http://mock-json-url', {
      timeout: 10000
    });
    expect(logger.info).toHaveBeenCalledWith('Updated status to: Test Song');
    expect(mockSetActivity).toHaveBeenCalledWith({
      name: '📀 Test Song',
      type: expect.any(Number),
      url: 'https://soundshineradio.com'
    });
  });

  it('utilise le fallback si axios échoue', async () => {
    axios.get.mockRejectedValue(new Error('axios fail'));
    mockSetActivity.mockResolvedValue();

    await updateStatusTask.execute(mockClient);

    expect(errorHandler.handleTaskError).toHaveBeenCalledWith(
      expect.any(Error),
      'UPDATE_STATUS'
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Error fetching metadata or updating status:',
      expect.any(Error)
    );
    expect(mockSetActivity).toHaveBeenCalledWith('Soundshine Radio', {
      type: expect.any(Number)
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Fallback activity set to Soundshine Radio'
    );
  });

  it('log une erreur si le fallback échoue aussi', async () => {
    axios.get.mockRejectedValue(new Error('axios fail'));
    mockSetActivity.mockRejectedValueOnce(new Error('setActivity fail'));

    await updateStatusTask.execute(mockClient);

    expect(errorHandler.handleTaskError).toHaveBeenCalledWith(
      expect.any(Error),
      'UPDATE_STATUS_FALLBACK'
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Error setting fallback activity:',
      expect.any(Error)
    );
  });
});

