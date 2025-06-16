// clear-commands.js
import { REST, Routes } from "discord.js";
import config from "../core/config.js";

const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

const isDev = process.argv.slice(2).includes("--dev");

const route = isDev
  ? Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_GUILD_ID)
  : Routes.applicationCommands(config.CLIENT_ID);

async function clearCommands() {
  try {
    console.log(`🏹 Suppression des commandes ${isDev ? "DEV" : "GLOBAL"}...`);

    // Récupère toutes les commandes
    const commands = await rest.get(route);

    for (const cmd of commands) {
      // garde l'Entry Point Command
      if (cmd.id === config.ENTRY_POINT_COMMAND_ID) {
        console.log(`⚡ Commande d'entrée non-supprimée : ${cmd.name}.`);
        continue;
      }

      console.log(`❌ Suppression de ${cmd.name} (${cmd.id})...`);

      await rest.delete(
        isDev
          ? Routes.applicationGuildCommand(
              config.CLIENT_ID,
              config.DEV_GUILD_ID,
              cmd.id
            )
          : Routes.applicationCommand(config.CLIENT_ID, cmd.id)
      );
    }

    console.log("✅ Commandes toutes supprimées.");
  } catch (error) {
    console.error("❌ Erreur pendant la suppression :", error);
  }
}

clearCommands();
