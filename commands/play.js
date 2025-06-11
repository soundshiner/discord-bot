import { SlashCommandBuilder, ChannelType } from "discord.js";
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
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("▶️ Lance le stream dans un Stage Channel")
    .setDMPermission(false),
  async execute(interaction) {
    const channel = interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply({
        content: "❌ Tu dois être dans un salon vocal ou Stage Channel.",
        ephemeral: true,
      });
    }

    if (channel.type !== ChannelType.GuildStageVoice) {
      return interaction.reply({
        content: "❌ Cette commande ne fonctionne que dans un Stage Channel.",
        ephemeral: true,
      });
    }

    try {
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
        interaction.followUp("▶️ Stream lancé dans le stage channel.");
      });

      player.on("error", (error) => {
        console.error("❌ Erreur du player:", error);
        interaction.followUp("❌ Erreur pendant la lecture du stream.");
      });

      interaction.client.audio = { connection, player };

      await interaction.reply("🔄 Connexion au stage channel...");
    } catch (error) {
      console.error("❌ Erreur exécution /play :", error);
      await interaction.reply({
        content: "❌ Une erreur est survenue pendant la tentative de lecture.",
        ephemeral: true,
      });
    }
  },
};
