import { PermissionFlagsBits } from "discord.js";

export default {
  name: "changestopic",
  description: "Change le sujet d'un Stage Voice Channel",
  usage: "<ID_du_Stage_Channel> <nouveau_sujet>",
  async execute(message, args, client, logger) {
    const channelId = args[0];
    const newTopic = args.slice(1).join(" ");

    try {
      const channel = await message.guild.channels.fetch(channelId);
      if (!channel) {
        logger.warn(`Canal avec ID ${channelId} introuvable`);
        return message.reply("Canal introuvable.");
      }
      if (channel.type !== 13) {
        logger.warn(
          `Le canal ${channelId} n'est pas un Stage Channel (type: ${channel.type})`
        );
        return message.reply("Ce canal n'est pas un Stage Channel.");
      }

      const botMember = message.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        logger.warn(
          `Permissions insuffisantes pour modifier le Stage Channel ${channelId}`
        );
        return message.reply(
          "Je n'ai pas les permissions nécessaires pour modifier ce Stage Channel."
        );
      }

      if (!channel.stageInstance) {
        await channel.createStageInstance({ topic: newTopic });
        logger.success(
          `Nouvelle instance de stage créée pour le canal ${channel.id}`
        );
        await message.reply(
          "Une nouvelle instance de stage a été créée avec succès."
        );
      } else {
        await channel.stageInstance.edit({ topic: newTopic });
        logger.success(
          `Sujet de l\'instance de stage mis à jour pour le canal ${channel.id}`
        );
        await message.reply(
          "Le sujet de l'instance de stage a été mis à jour avec succès."
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du canal: ${error.message}`);
      return message.reply(
        "Une erreur s'est produite lors de la récupération du canal."
      );
    }
  },
};
