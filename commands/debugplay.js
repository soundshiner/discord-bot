import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { checkStreamOnline } from "../utils/checkStreamOnline.js";
import config from "../core/config.js";
const { STREAM_URL } = config;
import logger from "../utils/logger.js";

export default {
  name: "debugplay",
  description: "🧪 Debug: play stream and trace each step",
  async execute(message) {
    const member = message.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return message.reply(
        "❌ Tu dois d’abord rejoindre un salon vocal ou Stage channel !"
      );
    }

    logger.info(
      `[DEBUG] Salon détecté: ${voiceChannel.name} (type ${voiceChannel.type})`
    );

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    if (voiceChannel.type === 13) {
      try {
        logger.info(
          "[DEBUG] Stage Channel détecté. Tentative de création de StageInstance..."
        );

        await message.guild.stageInstances.create({
          channel: voiceChannel.id,
          topic: "🎶 Stream Debug Session",
        });

        logger.success("✅ StageInstance créée avec succès.");
        await message.guild.members.me.voice.setSuppressed(false);
        logger.success("✅ Demande de parole envoyée (setSuppressed false).");
      } catch (error) {
        logger.error(
          "❌ Erreur StageInstance ou setSuppressed: " + error.message
        );
      }
    }

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    player.on(AudioPlayerStatus.Idle, () => {
      logger.info("🔁 Player est Idle (pas de son en cours).");
    });

    player.on(AudioPlayerStatus.Playing, () => {
      logger.success("🔊 Player joue actuellement du son !");
    });

    player.on("error", (error) => {
      logger.error(`❌ Erreur du player: ${error.message}`);
    });

    const isStreamOnline = await checkStreamOnline();
    logger.info(`[DEBUG] Stream en ligne ? ${isStreamOnline}`);

    if (isStreamOnline) {
      try {
        const resource = createAudioResource(STREAM_URL);
        logger.info("✅ Audio resource created successfully.");
        player.play(resource);
        connection.subscribe(player);
        message.reply("🔴 Tentative de lecture du stream en cours...");
      } catch (error) {
        logger.error("❌ Error creating audio resource: " + error.message);
        return message.reply(
          "Une erreur s'est produite lors de la création de la ressource audio."
        );
      }
    } else {
      message.reply("⚠️ Le stream semble hors ligne. Test annulé.");
    }
  },
};
