import { SlashCommandBuilder, ChannelType } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { checkStreamOnline } from "../utils/checkStreamOnline.js";
import config from "../core/config.js";
import logger from "../utils/logger.js";

const { STREAM_URL } = config;

export default {
  data: new SlashCommandBuilder()
    .setName("debugplay")
    .setDescription("🧪 Debug: play stream and trace each step")
    .setDMPermission(false),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content:
          "❌ Tu dois d’abord rejoindre un salon vocal ou Stage channel !",
        ephemeral: true,
      });
    }

    logger.info(
      `[DEBUG] Salon détecté: ${voiceChannel.name} (type ${voiceChannel.type})`
    );

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    if (voiceChannel.type === ChannelType.GuildStageVoice) {
      try {
        logger.info(
          "[DEBUG] Stage Channel détecté. Création de StageInstance..."
        );
        await interaction.guild.stageInstances.create({
          channel: voiceChannel.id,
          topic: "🎶 Stream Debug Session",
        });

        logger.success("✅ StageInstance créée !");
        await interaction.guild.members.me.voice.setSuppressed(false);
        logger.success("✅ Suppression de la suppression de parole.");
      } catch (error) {
        logger.error("❌ Erreur StageInstance/setSuppressed: " + error.message);
      }
    }

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    player.on(AudioPlayerStatus.Idle, () =>
      logger.info("🔁 Player est Idle (pas de son en cours).")
    );
    player.on(AudioPlayerStatus.Playing, () =>
      logger.success("🔊 Player joue actuellement du son !")
    );
    player.on("error", (error) =>
      logger.error(`❌ Erreur du player: ${error.message}`)
    );

    const isStreamOnline = await checkStreamOnline();
    logger.info(`[DEBUG] Stream en ligne ? ${isStreamOnline}`);

    if (isStreamOnline) {
      try {
        const resource = createAudioResource(STREAM_URL);
        logger.info("✅ Audio resource créée.");
        player.play(resource);
        connection.subscribe(player);

        return interaction.reply(
          "🔴 Tentative de lecture du stream en cours..."
        );
      } catch (error) {
        logger.error("❌ Audio resource error: " + error.message);
        return interaction.reply("Erreur lors de la lecture du stream.");
      }
    } else {
      return interaction.reply("⚠️ Le stream semble hors ligne. Test annulé.");
    }
  },
};
