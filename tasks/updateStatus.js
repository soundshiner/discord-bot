let lastSong = null;
let intervalId;

function startUpdateStatus(client, logger, JSON_URL) {
  intervalId = setInterval(async () => {
    try {
      const { data } = await axios.get(JSON_URL, { timeout: 10000 });
      let currentSong = "Stream offline or no song information available";

      if (data.icestats?.source) {
        currentSong = data.icestats.source.title || "No title available";
      }

      if (currentSong !== lastSong) {
        lastSong = currentSong;

        await client.user.setActivity({
          name: `📀 ${currentSong}`,
          type: ActivityType.Custom,
          url: "https://soundshineradio.com",
        });

        logger.info(`Updated status to: ${currentSong}`);
      }
    } catch (error) {
      logger.warn(`Erreur updateStatus: ${error.message}`);
    }
  }, 5000);

  return intervalId;
}

function stopUpdateStatus() {
  if (intervalId) clearInterval(intervalId);
}

export default {
  name: "updateStatus",
  start: startUpdateStatus,
  stop: stopUpdateStatus,
};
