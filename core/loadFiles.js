// ========================================
// core/loadFiles.js (ESM)
// ========================================
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const loadFiles = async (folderName, type, client) => {
  const basePath = path.join(__dirname, "..", folderName);

  if (!fs.existsSync(basePath)) {
    logger.warn(`Dossier ${folderName} introuvable.`);
    return;
  }

  const files = fs.readdirSync(basePath).filter((file) => {
    if (folderName === "utils" && type === "task") return false;
    return file.endsWith(".js");
  });

  if (files.length > 0) {
    logger.section(
      type === "command"
        ? "commandes"
        : type === "event"
        ? "événements"
        : type === "task"
        ? "tâches"
        : "utilitaires"
    );
  }

  const loadedFiles = [];
  const failedFiles = [];

  for (const file of files) {
    const filePath = path.join(basePath, file);
    try {
      const fileModule = await import(pathToFileURL(filePath).href);

      switch (type) {
        case "command":
          if (
            fileModule.default?.name &&
            typeof fileModule.default?.execute === "function"
          ) {
            client.commands.set(fileModule.default.name, fileModule.default);
            logger.success(`Commande chargée : ${fileModule.default.name}`);
            loadedFiles.push(fileModule.default.name);
          } else {
            logger.warn(`Commande invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case "event":
          if (
            fileModule.default?.name &&
            typeof fileModule.default?.execute === "function"
          ) {
            const handler = (...args) =>
              fileModule.default.execute(...args, client);
            if (fileModule.default.once) {
              client.once(fileModule.default.name, handler);
            } else {
              client.on(fileModule.default.name, handler);
            }
            logger.success(`Événement chargé : ${fileModule.default.name}`);
            loadedFiles.push(fileModule.default.name);
          } else {
            logger.warn(`Événement invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case "task":
          if (
            fileModule.default?.name &&
            typeof fileModule.default?.execute === "function"
          ) {
            if (fileModule.default.interval) {
              setInterval(
                () => fileModule.default.execute(client),
                fileModule.default.interval
              );
            } else {
              fileModule.default.execute(client);
            }
            logger.success(`Tâche chargée : ${fileModule.default.name}`);
            loadedFiles.push(fileModule.default.name);
          } else {
            logger.warn(`Tâche invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case "util":
          logger.custom("UTIL", `Fichier chargé : ${file}`, "gray");
          loadedFiles.push(file);
          break;

        default:
          logger.warn(`Type non reconnu pour ${file} : ${type}`);
          failedFiles.push(file);
          break;
      }
    } catch (err) {
      logger.error(`Erreur lors du chargement de ${file} : ${err.message}`);
      failedFiles.push(file);
    }
  }

  if (loadedFiles.length > 0 || failedFiles.length > 0) {
    logger.custom(
      "RÉSUMÉ",
      `${type} - Chargés: ${loadedFiles.length}, Échecs: ${failedFiles.length}`,
      loadedFiles.length > 0 ? "green" : "red"
    );
  }

  return {
    loaded: loadedFiles,
    failed: failedFiles,
    total: files.length,
  };
};
