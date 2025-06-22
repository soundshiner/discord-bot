// ========================================
// core/loadFiles.js (ESM)
// ========================================
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const loadFiles = async (
  folderName,
  type,
  client,
  app = null,
  loggerInstance = logger,
  dynamicImport = modulePath => import(modulePath) // <-- new param
) => {
  try {
    const basePath = path.join(__dirname, '..', folderName);

    if (!fs.existsSync(basePath)) {
      loggerInstance.warn(`Dossier ${folderName} introuvable.`);
      return {
        loaded: [],
        failed: [],
        total: 0
      };
    }

    const files = fs.readdirSync(basePath).filter(file => file.endsWith('.js'));

    // Debug: log what files are found
    loggerInstance.debug('loadFiles: basePath =', basePath);
    loggerInstance.debug('loadFiles: all files =', fs.readdirSync(basePath));
    loggerInstance.debug('loadFiles: js files =', files);

    if (files.length > 0) {
      loggerInstance.section(
        type === 'command'
          ? 'commandes'
          : type === 'event'
            ? 'événements'
            : type === 'task'
              ? 'tâches'
              : type === 'route'
                ? 'routes'
                : 'utilitaires'
      );
    }

    const loadedFiles = [];
    const failedFiles = [];

    for (const file of files) {
      const filePath = path.join(basePath, file);

      // Debug: log the file being imported
      loggerInstance.debug('loadFiles: importing', filePath, pathToFileURL(filePath).href);

      try {
        const fileModule = await dynamicImport(pathToFileURL(filePath).href);

        switch (type) {
        case 'command':
          if (fileModule.default?.data?.name && typeof fileModule.default?.execute === 'function') {
            client.commands.set(fileModule.default.data.name, fileModule.default);
            loggerInstance.custom('CMD', `Commandes chargé : ${fileModule.default.data.name}`);
            loadedFiles.push(fileModule.default.data.name);
          } else {
            loggerInstance.warn(`Commande invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case 'event':
          if (fileModule.default?.name && typeof fileModule.default?.execute === 'function') {
            const handler = (...args) => fileModule.default.execute(...args, client);
            if (fileModule.default.once) {
              client.once(fileModule.default.name, handler);
            } else {
              client.on(fileModule.default.name, handler);
            }
            loggerInstance.custom('EVENTS', `Événement chargé : ${fileModule.default.name}`);
            loadedFiles.push(fileModule.default.name);
          } else {
            loggerInstance.warn(`Événement invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case 'task':
          if (fileModule.default?.name && typeof fileModule.default?.execute === 'function') {
            if (fileModule.default.interval) {
              setInterval(() => fileModule.default.execute(client), fileModule.default.interval);
            } else {
              fileModule.default.execute(client);
            }
            loggerInstance.custom('TASKS', `Tâche chargée : ${fileModule.default.name}`);
            loadedFiles.push(fileModule.default.name);
          } else {
            loggerInstance.warn(`Tâche invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;

        case 'util':
          loggerInstance.custom('UTILS', `Fichier chargé : ${file}`);
          loadedFiles.push(file);
          break;

        case 'route': {
          if (!app) {
            throw new Error('L\'application Express doit être fournie pour charger des routes.');
          }
          const routeBase = file.replace('.js', '');
          if (typeof fileModule.default === 'function') {
            app.use(`/v1/${routeBase}`, fileModule.default(client, loggerInstance));
            loggerInstance.custom('ROUTE', `Route chargée : /v1/${routeBase}`);
            loadedFiles.push(routeBase);
          } else {
            loggerInstance.warn(`Route invalide dans ${file}`);
            failedFiles.push(file);
          }
          break;
        }

        default:
          loggerInstance.warn(`Type non reconnu pour ${file} : ${type}`);
          failedFiles.push(file);
          break;
        }
      } catch (err) {
        loggerInstance.error(`Erreur lors du chargement de ${file} : ${err.message}`);
        failedFiles.push(file);
      }
    }

    if (loadedFiles.length > 0 || failedFiles.length > 0) {
      loggerInstance.custom('RÉSUMÉ', `${type} - Chargés: ${loadedFiles.length}, Échecs: ${failedFiles.length}`);
    }

    return {
      loaded: loadedFiles,
      failed: failedFiles,
      total: files.length
    };
  } catch (error) {
    loggerInstance.error(`Erreur générale dans loadFiles pour ${folderName}:`, error);
    return {
      loaded: [],
      failed: [],
      total: 0
    };
  }
};
