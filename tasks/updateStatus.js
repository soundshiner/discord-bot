// tasks/updateStatus.js
import axios from "axios";
import config from "../core/config.js";
const { JSON_URL } = config;
import { ActivityType } from "discord.js";
import logger from "../utils/logger.js";

async function updateStatus(client) {
  try {
    const { data } = await axios.get(JSON_URL, { timeout: 10000 });

    let currentSong = "Stream offline or no song information available";

    if (data.icestats?.source) {
      currentSong = data.icestats.source.title || "No title available";
    }

    await client.user.setActivity({
      name: `📀 • ${currentSong}`,
      type: ActivityType.Custom,
      url: "https://soundshineradio.com",
    });

    logger.info(`Updated status to: ${currentSong}`);
  } catch (error) {
    logger.error("Error fetching metadata or updating status:", error);
    await client.user.setActivity("Soundshine Radio", {
      type: ActivityType.Listening,
    });
    logger.warn("Fallback activity set to Soundshine Radio");
  }
}

export default {
  name: "updateStatus",
  interval: 5000,
  execute: updateStatus,
};
