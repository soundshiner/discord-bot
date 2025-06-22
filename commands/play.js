player.play(resource);
connection.subscribe(player);

// === Détection de silence ===
let silenceTimeout = null;
const alertChannelId = "1370851577258315957";

player.on(AudioPlayerStatus.Idle, () => {
  silenceTimeout = setTimeout(() => {
    const channel = interaction.client.channels.cache.get(alertChannelId);
    if (channel && channel.isTextBased()) {
      channel.send("⚠️ Silence détecté depuis 15 secondes dans le vocal !");
    }
  }, 15000);
});

player.on(AudioPlayerStatus.Playing, () => {
  if (silenceTimeout) {
    clearTimeout(silenceTimeout);
    silenceTimeout = null;
  }
});
// === Fin détection de silence ===
