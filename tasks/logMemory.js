// tasks/logMemory.js
import logger from "../utils/centralizedLogger.js";

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function logMemory() {
  const mem = process.memoryUsage();
  logger.custom(
    "MEM",
    `rss: ${formatBytes(mem.rss)}, heapUsed: ${formatBytes(mem.heapUsed)}`,
    "cyan"
  );
}

export default {
  name: "logMemory",
  interval: 60000, // toutes les 60 sec
  execute: logMemory,
};

