import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import config from "../core/config.js";
const { STREAM_URL } = config;

export default {
  name: "play",
  description: "Lance le stream dans un Stage Channel",
  async execute(message) {
    try {
      const channel = message.member.voice.channel;
      if (!channel) {
        return message.reply(
          "❌ Tu dois être dans un salon vocal ou Stage Channel pour utiliser cette commande."
        );
      }
      if (channel.type !== 13) {
        return message.reply(
          "❌ Cette commande ne fonctionne que dans un Stage Channel."
        );
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      const resource = createAudioResource(STREAM_URL, { inlineVolume: true });

      player.play(resource);
      connection.subscribe(player);

      player.once(AudioPlayerStatus.Playing, () => {
        message.channel.send("▶️ Stream lancé dans le stage channel.");
      });

      player.on("error", (error) => {
        console.error("❌ Erreur du player:", error);
        message.channel.send(
          "❌ Une erreur est survenue lors de la lecture du stream."
        );
      });

      message.client.audio = { connection, player };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'exécution de la commande play:",
        error
      );
      message.reply(
        "❌ Une erreur est survenue lors de la tentative de lecture du stream."
      );
    }
  },
};
