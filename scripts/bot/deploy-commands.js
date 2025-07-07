// scripts/deploy-commands.js
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import process from 'process';
import chalk from 'chalk';
dotenv.config();

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isGlobal = args.includes('--global');
const shouldClear = args.includes('--clear');

const GUILD_ID = process.env.DEV_GUILD_ID;
const { CLIENT_ID } = process.env;
const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN || !CLIENT_ID) {
  console.error(chalk.red('❌ DISCORD_TOKEN ou CLIENT_ID manquant dans le fichier .env'));
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = []; // initialisation AVANT la boucle
const commandsDir = path.resolve('./bot/commands');
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsDir, file);
  const fileUrl = pathToFileURL(filePath).href;

  const command = (await import(fileUrl)).default;

  if (command?.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ La commande ${file} n'a pas de propriété 'data'`);
  }
}

(async () => {
  try {
    if (shouldClear) {
      console.log(chalk.magentaBright('🧹 Suppression des commandes Slash existantes...'));

      if (isDev) {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
        console.log(chalk.green(`✅ Toutes les commandes GUILD (${GUILD_ID}) supprimées.`));
      } else if (isGlobal) {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log(chalk.green('✅ Toutes les commandes GLOBALES supprimées.'));
      } else {
        console.error(chalk.red('❌ Vous devez préciser --dev ou --global avec --clear'));
        process.exit(1);
      }

      process.exit(0);
    }

    if (isDev) {
      console.log(chalk.cyan('🚀 Déploiement des commandes à la GUILD...'));
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(chalk.green(`✅ ${commands.length} commandes déployées à la GUILD (${GUILD_ID})`));
    } else if (isGlobal) {
      console.log(chalk.cyan('🌐 Déploiement des commandes GLOBALES...'));
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(chalk.green(`✅ ${commands.length} commandes globales déployées`));
    } else {
      console.error(chalk.red('❌ Spécifiez --dev ou --global pour déployer.'));
      process.exit(1);
    }

    // Hooks éventuels à implémenter plus tard
    if (args.includes('--with-version')) {
      console.log(chalk.gray('ℹ️  Version tagging activé (non implémenté)'));
    }

    if (args.includes('--restart-service')) {
      console.log(chalk.gray('ℹ️  Restart du service demandé (non implémenté)'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors du déploiement des commandes :'), error);
    process.exit(1);
  }
})();
