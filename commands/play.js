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
      // ✅ Répond immédiatement pour éviter le timeout
      await interaction.deferReply();

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

      const resource = createAudioResource(LOCAL_STREAM_URL, {
        inlineVolume: true,
      });

      player.play(resource);
      connection.subscribe(player);

      interaction.client.audio = { connection, player };

      // 🔁 Sécurité si le stream prend trop de temps
      const timeout = setTimeout(() => {
        interaction.editReply(
          "⚠️ Aucun son détecté après 5s. Lecture échouée ?"
        );
      }, 5000);

      player.once(AudioPlayerStatus.Playing, async () => {
        clearTimeout(timeout);
        await interaction.editReply("▶️ Stream lancé dans le stage channel.");
      });

      player.on("error", async (error) => {
        clearTimeout(timeout);
        console.error("❌ Erreur du player:", error);
        await interaction.editReply("❌ Erreur pendant la lecture du stream.");
      });
    } catch (error) {
      console.error("❌ Erreur exécution /play :", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content:
            "❌ Une erreur est survenue pendant la tentative de lecture.",
        });
      } else {
        await interaction.reply({
          content:
            "❌ Une erreur est survenue pendant la tentative de lecture.",
          ephemeral: true,
        });
      }
    }
  },
};
