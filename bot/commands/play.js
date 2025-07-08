import { SlashCommandBuilder, ChannelType, MessageFlags } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior
} from '@discordjs/voice';
import config from '../config.js';
import logger from '../logger.js';

const { STREAM_URL } = config;

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('▶️ Lance le stream dans un Stage Channel')
    .setDMPermission(false),

  async execute (interaction) {
    try {
      const { voice } = interaction.member;
      const channel = voice && voice.channel;

      if (!channel) {
        return interaction.reply({
          content: '❌ Tu dois être dans un salon vocal ou Stage Channel.',
          flags: MessageFlags.Ephemeral
        });
      }

      if (channel.type !== ChannelType.GuildStageVoice) {
        return interaction.reply({
          content: '❌ Cette commande ne fonctionne que dans un Stage Channel.',
          flags: MessageFlags.Ephemeral
        });
      }

      // ✅ Répond immédiatement pour éviter le timeout
      await interaction.deferReply();

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause
        }
      });

      const resource = createAudioResource(STREAM_URL, {
        inlineVolume: true
      });

      player.play(resource);
      connection.subscribe(player);

      interaction.client.audio = { connection, player };

      // 🔁 Sécurité si le stream prend trop de temps
      const timeout = setTimeout(() => {
        interaction.editReply(
          '⚠️ Aucun son détecté après 5s. Lecture échouée ?'
        );
      }, 5000);

      player.once(AudioPlayerStatus.Playing, async () => {
        clearTimeout(timeout);
        await interaction.editReply('▶️ Stream lancé dans le stage channel.');
      });

      player.on('error', async (error) => {
        clearTimeout(timeout);
        logger.error('❌ Erreur du player:', error);
        return await interaction.editReply(
          '❌ Erreur pendant la lecture du stream.'
        );
      });
    } catch (error) {
      logger.error('❌ Erreur exécution /play :', error);
      if (interaction.deferred || interaction.replied) {
        return await interaction.editReply({
          content:
            '❌ Une erreur est survenue pendant la tentative de lecture.'
        });
      } else {
        return await interaction.reply({
          content:
            '❌ Une erreur est survenue pendant la tentative de lecture.',
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};

