import { SlashCommandBuilder } from 'discord.js';

const drinks = [
  'Mojito 🍃',
  'Sex on the Beach 🍑',
  'Piña Colada 🍍',
  'Whisky on the rocks 🥃',
  'Vodka Red Bull ⚡',
  'Thé glacé au citron 🍋',
  'Eau pétillante élégante 💧',
  'Bière artisanale 🍺',
  'Café noir serré ☕',
  'Smoothie mangue-passion 🥭'
];

export default {
  data: new SlashCommandBuilder()
    .setName('drink')
    .setDescription('Offre un drink à quelqu’un')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('La personne à qui offrir un verre')
        .setRequired(true)),

  async execute (interaction) {
    const target = interaction.options.getUser('user');
    const sender = interaction.user;
    const drink = randomDrink();

    if (target.id === sender.id) {
      await interaction.reply({
        content: `🤨 T'offrir un verre à toi-même ? Allez va... tiens, bois ça. *${drink}*`,
        ephemeral: false
      });
      return 'self_drink';
    }

    await interaction.reply({
      content: `🍸 **${sender.username}** offre un ${drink} à **${target.username}** ! Santé ! 🥂`,
      ephemeral: false
    });

    return 'drink_sent';
  }
};

function randomDrink () {
  return drinks[Math.floor(Math.random() * drinks.length)];
}
