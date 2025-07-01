import fetch from "node-fetch";
import logger from "../utils/centralizedLogger.js";
import config from "../core/config.js";

const { JSON_URL } = config;

export async function checkStreamOnline() {
  try {
    const response = await fetch(JSON_URL, {
      timeout: 5000,
    });
    const { data } = response;
    const title = data?.icestats?.source?.title;

    return title !== undefined && title !== "";
  } catch (error) {
    logger.error("Error checking stream status:", error);
    return false;
  }
}

