import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Renvoie la latence du bot");

export async function execute(interaction) {
  const sent = await interaction.reply({
    content: "Ping...",
    fetchReply: true,
  });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply(
    `🏓 Pong !\n🕒 Latence bot: **${latency}ms**\n📡 Latence API: **${apiLatency}ms**`
  );
}
