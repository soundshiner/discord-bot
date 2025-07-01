import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getCurrentTrack, getPlaylist } from "../utils/playlistManager.js";
import { formatDuration, formatTimestamp } from "../utils/formatters.js";
import { getWallpaper } from "./getwallpaper.js";
import { postToSocialChannel } from "../utils/socialChannel.js";
import { validateURL } from "../utils/validateURL.js";
import { genres } from "../utils/genres.js";
import config from "../core/config.js";
import logger from "../utils/centralizedLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("📅 Affiche l'horaire des programmes")
    .setDMPermission(false),
  async execute(interaction) {
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
        .setTitle("📅 Choose a language")
        .setDescription("Clique sur un des boutons pour afficher l'horaire.");

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

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: false,
      });

      const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        time: 15_000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "schedule_fr") {
          await i.update({
            embeds: [
              new EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle("**Horaire (Version Française)**")
                .setDescription(frSchedule),
            ],
            components: [],
          });
        } else if (i.customId === "schedule_en") {
          await i.update({
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
      logger.error("Erreur lecture horaire : ", error);
      return await interaction.reply({
        content: "❌ Impossible de lire l'horaire.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

