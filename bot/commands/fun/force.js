import { SlashCommandBuilder } from 'discord.js';
import { setYodaMode } from '../../../utils/bot/yoda-config.js'; // adapte le chemin si besoin

export const data = new SlashCommandBuilder()
  .setName('force')
  .setDescription('Active ou désactive la Force dans le bot.')
  .addBooleanOption((option) =>
    option
      .setName('on')
      .setDescription('true pour activer, false pour désactiver')
      .setRequired(true));

export async function execute (interaction) {
  const enable = interaction.options.getBoolean('on');
  const guildId = interaction.guild.id;

  setYodaMode(guildId, enable);

  await interaction.reply(
    enable
      ? '💫 La Force en moi, maintenant elle est.'
      : '🤖 Humain redevenu, je suis.'
  );
}

// Pour que ton loader de commandes fonctionne
export default { data, execute };

