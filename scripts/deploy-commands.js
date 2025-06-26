// scripts/deploy-commands.js
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import process from 'process';
import chalk from 'chalk';

dotenv.config();

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isGlobal = args.includes('--global');
const shouldClear = args.includes('--clear');

const GUILD_ID = process.env.TEST_GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN || !CLIENT_ID) {
  console.error(chalk.red('❌ BOT_TOKEN ou CLIENT_ID manquant dans le fichier .env'));
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Chargement des commandes
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.resolve('./commands', file);
  const command = (await import(filePath)).default;

  if (command?.data) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(chalk.yellow(`⚠️  La commande ${file} n'a pas de propriété 'data'`));
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
