import axios from "axios";
import config from "../core/config.js";
import logger from "../utils/logger.js";

const { JSON_URL } = config;

export async function checkStreamOnline() {
  try {
    const response = await axios.get(JSON_URL);
    const data = response.data;
    const title = data?.icestats?.source?.title;

    return title !== undefined && title !== "";
  } catch (error) {
    logger.error("Error checking stream status:", error);
    return false;
  }
}
