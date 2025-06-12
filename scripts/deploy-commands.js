import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { REST, Routes } from "discord.js";
import config from "../core/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isGlobal = args.includes("--global");

if (!isDev && !isGlobal) {
  console.error("❌ Spécifie --dev ou --global pour déployer les commandes.");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "..", "commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".js")
);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileURL = pathToFileURL(filePath).href;
  const command = (await import(fileURL)).default;

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(
      `⚠️ La commande ${file} est incomplète (data/execute manquant).`
    );
  }
}

const rest = new REST({ version: "10" }).setToken(config.BOT_TOKEN);

try {
  console.log(
    `🔄 Déploiement de ${commands.length} commandes ${
      isDev ? "en mode DEV" : "GLOBAL"
    }...`
  );

  const route = isDev
    ? Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_GUILD_ID)
    : Routes.applicationCommands(config.CLIENT_ID);

  await rest.put(route, { body: commands });

  console.log("✅ Commandes déployées avec succès.");
} catch (error) {
  console.error("❌ Erreur pendant le déploiement :", error);
}
