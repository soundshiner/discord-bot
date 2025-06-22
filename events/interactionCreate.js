import handlePlaylistSelect from "../handlers/handlePlaylistSelect.js"; // on importe ton handler

export default {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isCommand()) {
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
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select_playlist") {
        try {
          await handlePlaylistSelect(interaction);
        } catch (error) {
          console.error("Erreur dans handlePlaylistSelect:", error);
          if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
              content:
                "❌ Une erreur est survenue lors du lancement de la playlist.",
            });
          } else {
            await interaction.reply({
              content:
                "❌ Une erreur est survenue lors du lancement de la playlist.",
              ephemeral: true,
            });
          }
        }
      }
    }
  },
};
