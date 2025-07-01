// core/loadFiles.js (ESM)
import { readdir, stat } from "fs/promises";
import { join, extname } from "path";
import logger from "../utils/centralizedLogger.js";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = fileURLToPath(import.meta.url)
  .split("/")
  .slice(0, -1)
  .join("/");

async function loadFiles(
  folderName,
  type,
  client,
  app = null,
  loggerInstance = logger,
  dynamicImport = (modulePath) => import(modulePath)
) {
  try {
    const basePath = join(__dirname, "..", folderName);
    if (!(await stat(basePath))) {
      loggerInstance.warn(`Dossier ${folderName} introuvable.`);
      return { loaded: [], failed: [], total: 0 };
    }
    const files = await readdir(basePath).then((f) =>
      f.filter((f) => extname(f) === ".js")
    );
    if (files.length) {
      loggerInstance.section(
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
      const filePath = join(basePath, file);
      loggerInstance.debug(
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
              loggerInstance.warn(`Commande invalide dans ${file}`);
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
              loggerInstance.warn(`Événement invalide dans ${file}`);
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
              loggerInstance.warn(`Tâche invalide dans ${file}`);
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
              loggerInstance.warn(`Route invalide dans ${file}`);
              failedFiles.push(file);
            }
            break;
          }
          default: {
            loggerInstance.warn(`Type non reconnu pour ${file} : ${type}`);
            failedFiles.push(file);
          }
        }
      } catch (err) {
        loggerInstance.error(
          `Erreur lors du chargement de ${file} : ${err.message}`
        );
        failedFiles.push(file);
      }
    }

    if (loadedFiles.length > 0 || failedFiles.length > 0) {
      loggerInstance.custom(
        "RÉSUMÉ",
        `${type} - Chargés: ${loadedFiles.length}, Échecs: ${failedFiles.length}`
      );
    }
    return { loaded: loadedFiles, failed: failedFiles, total: files.length };
  } catch (error) {
    loggerInstance.error(
      `Erreur générale dans loadFiles pour ${folderName}: ${error.message}`
    );
    return { loaded: [], failed: [], total: 0 };
  }
}

export default loadFiles;
export { loadFiles };

