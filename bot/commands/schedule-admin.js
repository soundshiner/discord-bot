import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import scheduleService from "../core/services/ScheduleService.js";
import logger from "../logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("schedule-admin")
    .setDescription("🔧 Gestion des horaires (Admin uniquement)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Vérifier l'état du service de schedule")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("Recharger le schedule depuis le fichier")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear-cache")
        .setDescription("Vider le cache du schedule")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case "status": {
          const status = await scheduleService.getStatus();
          const embed = {
            color: status.hasData ? 0x2ecc71 : 0xe74c3c,
            title: "📊 Statut du Service Schedule",
            fields: [
              {
                name: "Fichier existe",
                value: status.fileExists ? "✅" : "❌",
                inline: true,
              },
              {
                name: "Cache valide",
                value: status.cacheValid ? "✅" : "❌",
                inline: true,
              },
              {
                name: "Données disponibles",
                value: status.hasData ? "✅" : "❌",
                inline: true,
              },
              { name: "Version", value: status.version, inline: true },
              {
                name: "Dernière mise à jour",
                value: new Date(status.lastUpdate).toLocaleString("fr-FR"),
                inline: true,
              },
            ],
          };

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case "reload": {
          scheduleService.clearCache();
          const schedule = await scheduleService.loadSchedule();

          await interaction.reply({
            content: `✅ Schedule rechargé avec succès !\nVersion: ${schedule.version}\nDernière mise à jour: ${schedule.lastUpdated}`,
            ephemeral: true,
          });
          break;
        }

        case "clear-cache": {
          scheduleService.clearCache();
          await interaction.reply({
            content: "✅ Cache du schedule vidé avec succès !",
            ephemeral: true,
          });
          break;
        }

        default:
          await interaction.reply({
            content: "❌ Sous-commande non reconnue",
            ephemeral: true,
          });
      }
    } catch (error) {
      logger.error("Erreur dans la commande schedule-admin:", error);
      await interaction.reply({
        content:
          "❌ Une erreur est survenue lors de l'exécution de la commande",
        ephemeral: true,
      });
    }
  },
};
