import { SlashCommandBuilder, ChannelType, MessageFlags } from "discord.js";
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
    try {
      const { member } = interaction;
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        return await interaction.reply({
          content:
            "❌ Tu dois d'abord rejoindre un salon vocal ou Stage channel !",
          flags: MessageFlags.Ephemeral,
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

          logger.info("✅ StageInstance créée !");
          await interaction.guild.members.me.voice.setSuppressed(false);
          logger.info("✅ Suppression de la suppression de parole.");
        } catch (error) {
          logger.error(
            `❌ Erreur StageInstance/setSuppressed: ${error.message}`
          );
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
        logger.info("🔊 Player joue actuellement du son !")
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

          return await interaction.reply(
            "🔴 Tentative de lecture du stream en cours..."
          );
        } catch (error) {
          logger.error(`❌ Audio resource error: ${error.message}`);
          return await interaction.reply(
            "Erreur lors de la lecture du stream."
          );
        }
      } else {
        return await interaction.reply(
          "⚠️ Le stream semble hors ligne. Test annulé."
        );
      }
    } catch (error) {
      logger.error("Erreur lors de la commande debugplay:", error);
      return await interaction.reply({
        content: "❌ Erreur lors de la commande debug.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

