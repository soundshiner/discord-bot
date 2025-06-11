import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import logger from "../utils/logger.js";

// Gestion du __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "schedule",
  description: "Displays the current schedule of programs",
  async execute(message) {
    try {
      const schedulePath = path.join(__dirname, "..", "schedule.txt");
      const scheduleContent = fs.readFileSync(schedulePath, "utf-8");

      const sections = scheduleContent.split("🗓");
      const enRaw = sections[1]?.trim() || "No data available.";
      const frRaw = sections[2]?.trim() || "Aucune donnée disponible.";

      const enSchedule = enRaw.split("\n").slice(1).join("\n").trim();
      const frSchedule = frRaw.split("\n").slice(1).join("\n").trim();

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Choose a language")
        .setDescription(
          "Click on one of the buttons below to see the schedule."
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("schedule_fr")
          .setLabel("Français")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("schedule_en")
          .setLabel("English")
          .setStyle(ButtonStyle.Secondary)
      );

      await message.reply({ embeds: [embed], components: [row] });

      const collector = message.channel.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === message.author.id,
        time: 15_000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "schedule_fr") {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle("**Horaire (Version Française)**")
                .setDescription(frSchedule),
            ],
            components: [],
          });
        } else if (interaction.customId === "schedule_en") {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle("**Schedule (English version)**")
                .setDescription(enSchedule),
            ],
            components: [],
          });
        }
      });
    } catch (error) {
      logger.error("Error reading schedule: ", error);
      message.reply("Unable to fetch the schedule.");
    }
  },
};
