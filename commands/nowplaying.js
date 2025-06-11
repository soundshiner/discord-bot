import axios from "axios";
import config from "../core/config.js";
const { JSON_URL } = config;
import logger from "../utils/logger.js";

export default {
  name: "nowplaying",
  description: "Displays the currently playing song",
  async execute(message) {
    try {
      const response = await axios.get(JSON_URL);
      const data = response.data;
      const currentSong =
        data?.icestats?.source?.title || "No song information available";

      message.reply(`🎶 Now playing: **${currentSong}**`);
    } catch (error) {
      logger.error(`Error fetching current song: ${error.message}`);
      message.reply("Unable to fetch current song.");
    }
  },
};
