import axios from "axios";
import config from "../core/config.js";
const { UNSPLASH_ACCESS_KEY } = config;
import logger from "../utils/logger.js";

export default {
  name: "getwall",
  description: "Fetches a random photo from Unsplash",
  async execute(message) {
    try {
      const response = await axios.get(
        `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}&count=1`
      );

      const photoData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      const photoUrl = photoData?.urls?.regular;

      if (photoUrl) {
        message.reply(photoUrl);
      } else {
        message.reply("Couldn't fetch a photo, try again later.");
      }
    } catch (error) {
      logger.error("Error fetching photo from Unsplash: ", error);
      message.reply("Unable to fetch a random photo.");
    }
  },
};
