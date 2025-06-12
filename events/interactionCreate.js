// events/interactionCreate.js
export default {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Erreur commande ${interaction.commandName}:`, error);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content:
            "❌ Une erreur est survenue pendant l’exécution de la commande.",
        });
      } else {
        await interaction.reply({
          content:
            "❌ Une erreur est survenue pendant l’exécution de la commande.",
          ephemeral: true,
        });
      }
    }
  },
};
