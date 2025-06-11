import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("changestopic")
    .setDescription("Change le sujet d'un Stage Voice Channel")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Le Stage Channel à modifier")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildStageVoice)
    )
    .addStringOption((option) =>
      option
        .setName("sujet")
        .setDescription("Le nouveau sujet du Stage")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client, logger) {
    const channel = interaction.options.getChannel("canal");
    const newTopic = interaction.options.getString("sujet");

    try {
      if (!channel) {
        logger.warn("Canal introuvable.");
        return interaction.reply({
          content: "❌ Canal introuvable.",
          ephemeral: true,
        });
      }

      if (channel.type !== ChannelType.GuildStageVoice) {
        logger.warn(
          `Le canal ${channel.id} n'est pas un Stage Channel (type: ${channel.type})`
        );
        return interaction.reply({
          content: "❌ Ce canal n'est pas un Stage Channel.",
          ephemeral: true,
        });
      }

      const botMember = await interaction.guild.members.fetchMe();
      if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
        logger.warn(
          `Permissions insuffisantes pour modifier le Stage Channel ${channel.id}`
        );
        return interaction.reply({
          content:
            "❌ Je n'ai pas les permissions nécessaires pour modifier ce Stage Channel.",
          ephemeral: true,
        });
      }

      const stageInstance = await channel
        .fetchStageInstance()
        .catch(() => null);

      if (!stageInstance) {
        await channel.createStageInstance({ topic: newTopic });
        logger.success(
          `Nouvelle instance de stage créée pour le canal ${channel.id}`
        );
        await interaction.reply(
          "✅ Une nouvelle instance de stage a été créée avec succès."
        );
      } else {
        await stageInstance.edit({ topic: newTopic });
        logger.success(
          `Sujet de l'instance de stage mis à jour pour le canal ${channel.id}`
        );
        await interaction.reply(
          "✅ Le sujet de l'instance de stage a été mis à jour avec succès."
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la modification du stage: ${error.message}`);
      return interaction.reply({
        content:
          "❌ Une erreur s'est produite lors de la modification du Stage Channel.",
        ephemeral: true,
      });
    }
  },
};
