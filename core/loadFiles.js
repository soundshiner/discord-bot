// core/loadFiles.js (ESM)
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadFiles(
  folderName,
  type,
  client,
  app = null,
  loggerInstance = logger,
  dynamicImport = (modulePath) => import(modulePath)
) {
  try {
    const basePath = path.join(__dirname, "..", folderName);
    if (!fs.existsSync(basePath)) {
      loggerInstance.logWarn(`Dossier ${folderName} introuvable.`);
      return { loaded: [], failed: [], total: 0 };
    }
    const files = fs.readdirSync(basePath).filter((f) => f.endsWith(".js"));
    if (files.length) {
      loggerInstance.sectionStart(
        type === "command"
          ? "commandes"
          : type === "event"
          ? "événements"
          : type === "task"
          ? "tâches"
          : type === "route"
          ? "routes"
          : "utilitaires"
      );
    }

    const loadedFiles = [];
    const failedFiles = [];

    for (const file of files) {
      const filePath = path.join(basePath, file);
      loggerInstance.logDebug(
        "loadFiles: importing",
        filePath,
        pathToFileURL(filePath).href
      );

      try {
        const fileModule = await dynamicImport(pathToFileURL(filePath).href);

        switch (type) {
          case "command": {
            if (
              fileModule.default?.data?.name &&
              typeof fileModule.default.execute === "function"
            ) {
              client.commands.set(
                fileModule.default.data.name,
                fileModule.default
              );
              loggerInstance.custom(
                "CMD",
                `Commande chargée : ${fileModule.default.data.name}`
              );
              loadedFiles.push(fileModule.default.data.name);
            } else {
              loggerInstance.logWarn(`Commande invalide dans ${file}`);
              failedFiles.push(file);
            }
            break;
          }
          case "event": {
            if (
              fileModule.default?.name &&
              typeof fileModule.default.execute === "function"
            ) {
              const handler = (...args) =>
                fileModule.default.execute(...args, client);
              if (fileModule.default.once)
                client.once(fileModule.default.name, handler);
              else client.on(fileModule.default.name, handler);
              loggerInstance.custom(
                "EVENTS",
                `Événement chargé : ${fileModule.default.name}`
              );
              loadedFiles.push(fileModule.default.name);
            } else {
              loggerInstance.logWarn(`Événement invalide dans ${file}`);
              failedFiles.push(file);
            }
            break;
          }
          case "task": {
            if (
              fileModule.default?.name &&
              typeof fileModule.default.execute === "function"
            ) {
              if (fileModule.default.interval) {
                setInterval(
                  () => fileModule.default.execute(client),
                  fileModule.default.interval
                );
              } else {
                fileModule.default.execute(client);
              }
              loggerInstance.custom(
                "TASKS",
                `Tâche chargée : ${fileModule.default.name}`
              );
              loadedFiles.push(fileModule.default.name);
            } else {
              loggerInstance.logWarn(`Tâche invalide dans ${file}`);
              failedFiles.push(file);
            }
            break;
          }
          case "util": {
            loggerInstance.custom("UTILS", `Fichier chargé : ${file}`);
            loadedFiles.push(file);
            break;
          }
          case "route": {
            if (!app)
              throw new Error(
                "L'application Express doit être fournie pour charger des routes."
              );
            const routeBase = file.replace(".js", "");
            if (typeof fileModule.default === "function") {
              app.use(
                `/v1/${routeBase}`,
                fileModule.default(client, loggerInstance)
              );
              loggerInstance.custom(
                "ROUTE",
                `Route chargée : /v1/${routeBase}`
              );
              loadedFiles.push(routeBase);
            } else {
              loggerInstance.logWarn(`Route invalide dans ${file}`);
              failedFiles.push(file);
            }
            break;
          }
          default: {
            loggerInstance.logWarn(`Type non reconnu pour ${file} : ${type}`);
            failedFiles.push(file);
          }
        }
      } catch (err) {
        loggerInstance.logError(
          `Erreur lors du chargement de ${file} : ${err.message}`
        );
      }
    }

    return { loaded: loadedFiles, failed: failedFiles, total: files.length };
  } catch (err) {
    loggerInstance.logError(
      `Erreur lors du chargement des fichiers : ${err.message}`
    );
    return { loaded: [], failed: [], total: 0 };
  }
}

export default loadFiles;

