// scripts/bot/deploy-commands.js
import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import process from "process";
import chalk from "chalk";
import { pathToFileURL } from "url";
dotenv.config();

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isGlobal = args.includes("--global");
const shouldClear = args.includes("--clear");

const GUILD_ID = process.env.TEST_GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN || !CLIENT_ID) {
  console.error(chalk.red("❌ DISCORD_TOKEN ou CLIENT_ID manquant dans le fichier .env"));
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

// Fonction pour parcourir récursivement tous les fichiers .js dans un dossier
function getAllCommandFiles(dir) {
  let commandFiles = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      commandFiles = commandFiles.concat(getAllCommandFiles(fullPath));
    } else if (file.isFile() && file.name.endsWith(".js")) {
      commandFiles.push(fullPath);
    }
  }

  return commandFiles;
}

const commandFiles = getAllCommandFiles("bot/commands");
const commands = [];

for (const filePath of commandFiles) {
  const command = (await import(pathToFileURL(filePath).href)).default;

  // Ignorer les sous-commandes (builder sans data)
  if (command?.builder && !command?.data) {
    console.log(chalk.gray(`↪︎ Ignoré (sous-commande) : ${filePath}`));
    continue;
  }

  if (!command?.data) {
    console.warn(chalk.yellow(`⚠️  La commande "${filePath}" n'a pas de propriété 'data'`));
    continue;
  }

  if (typeof command.data.toJSON === "function") {
    commands.push(command.data.toJSON());
    console.log(chalk.green(`+ Ajouté : ${command.data.name}`));
  } else {
    console.warn(chalk.yellow(`⚠️  'data' de "${filePath}" n'est pas un SlashCommandBuilder valide`));
  }
}

(async () => {
  try {
    if (shouldClear) {
      console.log(chalk.magentaBright("🧹 Suppression des commandes Slash existantes..."));

      if (isDev) {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
        console.log(chalk.green(`✅ Toutes les commandes GUILD (${GUILD_ID}) supprimées.`));
      } else if (isGlobal) {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log(chalk.green("✅ Toutes les commandes GLOBALES supprimées."));
      } else {
        console.error(chalk.red("❌ Vous devez préciser --dev ou --global avec --clear"));
        process.exit(1);
      }

      process.exit(0);
    }

    if (isDev) {
      console.log(chalk.cyan("🚀 Déploiement des commandes à la GUILD..."));
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(chalk.green(`✅ ${commands.length} commandes déployées à la GUILD (${GUILD_ID})`));
    } else if (isGlobal) {
      console.log(chalk.cyan("🌐 Déploiement des commandes GLOBALES..."));
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(chalk.green(`✅ ${commands.length} commandes globales déployées`));
    } else {
      console.error(chalk.red("❌ Spécifiez --dev ou --global pour déployer."));
      process.exit(1);
    }

    // Hooks éventuels
    if (args.includes("--with-version")) {
      console.log(chalk.gray("ℹ️  Version tagging activé (non implémenté)"));
    }

    if (args.includes("--restart-service")) {
      console.log(chalk.gray("ℹ️  Restart du service demandé (non implémenté)"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Erreur lors du déploiement des commandes :"), error);
    process.exit(1);
  }
})();
