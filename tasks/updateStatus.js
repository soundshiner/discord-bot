import axios from 'axios';
import config from '../core/config.js';
import { ActivityType } from 'discord.js';
import logger from '../utils/logger.js';
import errorHandler from '../utils/errorHandler.js';

const { JSON_URL } = config;
let lastSong = null;

async function updateStatus (client) {
  try {
    const { data } = await axios.get(JSON_URL, { timeout: 10000 });

    let currentSong = 'Stream offline or no song information available';

    if (data.icestats?.source) {
      const source = Array.isArray(data.icestats.source)
        ? data.icestats.source[0]
        : data.icestats.source;
      if (source?.title) {
        currentSong = source.title;
      }
    }

    if (currentSong !== lastSong) {
      logger.info(`Updated status to: ${currentSong}`);
      lastSong = currentSong;
    }

    await client.user.setActivity({
      name: `📀 ${currentSong}`,
      type: ActivityType.Custom,
      url: 'https://soundshineradio.com'
    });
  } catch (error) {
    errorHandler.handleTaskError(error, 'UPDATE_STATUS');
    logger.error('Error fetching metadata or updating status:', error);
    try {
      await client.user.setActivity('Soundshine Radio', {
        type: ActivityType.Listening
      });
      logger.warn('Fallback activity set to Soundshine Radio');
    } catch (fallbackError) {
      errorHandler.handleTaskError(fallbackError, 'UPDATE_STATUS_FALLBACK');
      logger.error('Error setting fallback activity:', fallbackError);
    }
  }
}

export default {
  name: 'updateStatus',
  interval: 5000,
  execute: updateStatus
};

