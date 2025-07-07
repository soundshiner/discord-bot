// ========================================
// bot/handlers/loadCommands.js (ESM)
// ========================================

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import logger from '../logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands (client) {
  try {
    const commandsPath = path.join(__dirname, '../commands');

    if (!fs.existsSync(commandsPath)) {
      logger.warn('Dossier commands introuvable.');
      return { loaded: [], failed: [], total: 0 };
    }

    const files = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

    if (files.length) {
      logger.section('Commandes');
    }

    const loadedCommands = [];
    const failedCommands = [];

    for (const file of files) {
      const filePath = path.join(commandsPath, file);
      logger.debug('loadCommands: importing', filePath);

      try {
        const fileModule = await import(pathToFileURL(filePath).href);

        if (
          fileModule.default?.data?.name
          && typeof fileModule.default.execute === 'function'
        ) {
          client.commands.set(fileModule.default.data.name, fileModule.default);
          logger.custom(
            'CMD',
            `Commande chargée : ${fileModule.default.data.name}`
          );
          loadedCommands.push(fileModule.default.data.name);
        } else {
          logger.warn(`Commande invalide dans ${file}`);
          failedCommands.push(file);
        }
      } catch (err) {
        logger.error(`Erreur lors du chargement de ${file} : ${err.message}`);
        failedCommands.push(file);
      }
    }

    logger.info(`${loadedCommands.length} commandes chargées avec succès`);
    if (failedCommands.length > 0) {
      logger.warn(`${failedCommands.length} commandes en échec`);
    }

    return {
      loaded: loadedCommands,
      failed: failedCommands,
      total: files.length
    };
  } catch (err) {
    logger.error(`Erreur lors du chargement des commandes : ${err.message}`);
    return { loaded: [], failed: [], total: 0 };
  }
}
