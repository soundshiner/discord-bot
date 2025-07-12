// scripts/deploy-commands.js
import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import process from "process";
import chalk from "chalk";

dotenv.config();

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isGlobal = args.includes("--global");
const shouldClear = args.includes("--clear");

const GUILD_ID = process.env.DEV_GUILD_ID || process.env.GUILD_ID;
const { CLIENT_ID } = process.env;
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error(chalk.red("❌ DISCORD_TOKEN manquant dans le fichier .env"));
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error(chalk.red("❌ CLIENT_ID manquant dans le fichier .env"));
  process.exit(1);
}

if (isDev && !GUILD_ID) {
  console.error(
    chalk.red("❌ DEV_GUILD_ID ou GUILD_ID manquant dans le fichier .env")
  );
  console.error(
    chalk.yellow(
      "💡 Assurez-vous que votre fichier .env contient une de ces variables :"
    )
  );
  console.error(chalk.yellow("   DEV_GUILD_ID=votre_guild_id"));
  console.error(chalk.yellow("   ou"));
  console.error(chalk.yellow("   GUILD_ID=votre_guild_id"));
  process.exit(1);
}

console.log(chalk.blue("🔧 Configuration :"));
console.log(chalk.blue(`   CLIENT_ID: ${CLIENT_ID}`));
console.log(chalk.blue(`   GUILD_ID: ${GUILD_ID || "Non défini"}`));
console.log(
  chalk.blue(
    `   Mode: ${
      isDev ? "Développement (Guild)" : isGlobal ? "Global" : "Non spécifié"
    }`
  )
);

const rest = new REST({ version: "10" }).setToken(TOKEN);

const commands = []; // initialisation AVANT la boucle
const commandsDir = path.resolve("./bot/commands");
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((file) => file.endsWith(".js"));

(async () => {
  console.log(chalk.cyan(`📁 Chargement des commandes depuis: ${commandsDir}`));
  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const fileUrl = pathToFileURL(filePath).href;
    try {
      const command = (await import(fileUrl)).default;
      if (command?.data) {
        commands.push(command.data.toJSON());
        console.log(chalk.green(`✅ ${file} chargé`));
      } else {
        console.warn(
          chalk.yellow(`⚠️ La commande ${file} n'a pas de propriété 'data'`)
        );
      }
    } catch (error) {
      console.error(
        chalk.red(`❌ Erreur lors du chargement de ${file}:`),
        error.message
      );
    }
  }
  console.log(chalk.cyan(`📊 Total: ${commands.length} commandes chargées`));

  try {
    if (shouldClear) {
      console.log(
        chalk.magentaBright("🧹 Suppression des commandes Slash existantes...")
      );

      if (isDev) {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
          body: [],
        });
        console.log(
          chalk.green(`✅ Toutes les commandes GUILD (${GUILD_ID}) supprimées.`)
        );
      } else if (isGlobal) {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log(
          chalk.green("✅ Toutes les commandes GLOBALES supprimées.")
        );
      } else {
        console.error(
          chalk.red("❌ Vous devez préciser --dev ou --global avec --clear")
        );
        process.exit(1);
      }

      process.exit(0);
    }

    if (isDev) {
      console.log(chalk.cyan("🚀 Déploiement des commandes à la GUILD..."));
      console.log(chalk.blue(`   Guild ID: ${GUILD_ID}`));
      console.log(chalk.blue(`   Client ID: ${CLIENT_ID}`));

      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(
        chalk.green(
          `✅ ${commands.length} commandes déployées à la GUILD (${GUILD_ID})`
        )
      );
    } else if (isGlobal) {
      console.log(chalk.cyan("🌐 Déploiement des commandes GLOBALES..."));
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(
        chalk.green(`✅ ${commands.length} commandes globales déployées`)
      );
    } else {
      console.error(chalk.red("❌ Spécifiez --dev ou --global pour déployer."));
      console.error(chalk.yellow("💡 Exemples :"));
      console.error(
        chalk.yellow("   npm run deploy:dev    # Déploiement guild")
      );
      console.error(
        chalk.yellow("   npm run deploy:global # Déploiement global")
      );
      process.exit(1);
    }

    // Hooks éventuels à implémenter plus tard
    if (args.includes("--with-version")) {
      console.log(chalk.gray("ℹ️  Version tagging activé (non implémenté)"));
    }

    if (args.includes("--restart-service")) {
      console.log(
        chalk.gray("ℹ️  Restart du service demandé (non implémenté)")
      );
    }
  } catch (error) {
    console.error(
      chalk.red("❌ Erreur lors du déploiement des commandes :"),
      error
    );

    // Informations de débogage
    if (error.code === 50035) {
      console.error(chalk.red("🔍 Détails de l'erreur :"));
      console.error(chalk.red(`   Code: ${error.code}`));
      console.error(chalk.red(`   Status: ${error.status}`));
      console.error(chalk.red(`   Method: ${error.method}`));
      console.error(chalk.red(`   URL: ${error.url}`));

      if (error.rawError?.errors?.guild_id) {
        console.error(
          chalk.red("   Problème avec guild_id - vérifiez votre configuration")
        );
      }
    }

    process.exit(1);
  }
})();

