// ========================================
// bot/handlers/loadCommands.js (ESM) - Version améliorée
// ========================================

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import logger from '../logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Charge récursivement tous les fichiers de commandes dans les sous-dossiers
 * @param {string} dirPath - Chemin du dossier à scanner
 * @param {string} basePath - Chemin de base pour les logs
 * @returns {Array} Liste des fichiers .js trouvés avec leurs chemins complets
 */
function getCommandFiles (dirPath, basePath = '') {
  const files = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Récursion dans les sous-dossiers
      const subFiles = getCommandFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push({
        name: entry.name,
        fullPath,
        relativePath,
        category: basePath || 'general'
      });
    }
  }

  return files;
}

/**
 * Valide qu'un module de commande est correctement structuré
 * @param {Object} commandModule - Module importé
 * @param {string} fileName - Nom du fichier pour les logs
 * @returns {Object} Résultat de validation
 */
function validateCommandModule (commandModule, fileName) {
  if (!commandModule.default) {
    return {
      valid: false,
      error: `Pas d'export default dans ${fileName}`
    };
  }

  const command = commandModule.default;

  if (!command.data || !command.data.name) {
    return {
      valid: false,
      error: `Pas de data.name dans ${fileName}`
    };
  }

  if (typeof command.execute !== 'function') {
    return {
      valid: false,
      error: `Pas de fonction execute dans ${fileName}`
    };
  }

  // Validation optionnelle des propriétés SlashCommand
  if (command.data.setName && typeof command.data.setName !== 'function') {
    return {
      valid: false,
      error: `data.setName invalide dans ${fileName}`
    };
  }

  return { valid: true };
}

/**
 * Charge toutes les commandes depuis le dossier commands et ses sous-dossiers
 * @param {Object} client - Client Discord.js
 * @param {Function} importFn - Fonction d'import (pour les tests)
 * @returns {Object} Statistiques de chargement
 */
export async function loadCommands (client, importFn = (src) => import(src)) {
  try {
    const commandsPath = path.join(__dirname, '../commands');

    if (!fs.existsSync(commandsPath)) {
      logger.warn('Dossier commands introuvable:', commandsPath);
      return { loaded: [], failed: [], total: 0, categories: {} };
    }

    // Récupérer tous les fichiers .js récursivement
    const commandFiles = getCommandFiles(commandsPath);

    if (commandFiles.length === 0) {
      logger.warn('Aucun fichier de commande trouvé');
      return { loaded: [], failed: [], total: 0, categories: {} };
    }

    logger.section('Chargement des commandes');
    logger.info(`${commandFiles.length} fichiers de commandes détectés`);

    const loadedCommands = [];
    const failedCommands = [];
    const categories = {};

    // Traiter chaque fichier de commande
    for (const fileInfo of commandFiles) {
      const { name: fileName, fullPath, relativePath, category } = fileInfo;

      try {
        // Import dynamique du module
        const fileUrl = pathToFileURL(fullPath).href;
        const commandModule = await importFn(fileUrl);

        // Ignorer les sous-commandes qui exportent un callback de builder
        if (
          commandModule?.default
          && typeof commandModule.default.data === 'function'
        ) {
          logger.debug(`Ignoré (sous-commande): ${relativePath}`);
          continue;
        }

        // Validation du module
        const validation = validateCommandModule(commandModule, fileName);
        if (!validation.valid) {
          logger.warn(validation.error);
          failedCommands.push({
            file: relativePath,
            error: validation.error
          });
          continue;
        }

        const command = commandModule.default;
        const commandName = command.data.name;

        // Vérifier les doublons
        if (client.commands.has(commandName)) {
          const error = `Commande "${commandName}" déjà enregistrée (doublon dans ${relativePath})`;
          logger.warn(error);
          failedCommands.push({
            file: relativePath,
            error
          });
          continue;
        }

        // Enregistrer la commande
        client.commands.set(commandName, command);

        // Organiser par catégorie
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(commandName);

        loadedCommands.push({
          name: commandName,
          file: relativePath,
          category
        });

        logger.custom('CMD', `${commandName} (${category})`);
      } catch (error) {
        const errorMsg = `Erreur lors du chargement de ${relativePath}: ${error.message}`;
        logger.error(errorMsg);
        failedCommands.push({
          file: relativePath,
          error: error.message
        });
      }
    }

    // Afficher les résultats
    logger.success(`${loadedCommands.length} commandes chargées avec succès`);

    if (Object.keys(categories).length > 0) {
      logger.info('Répartition par catégorie:');
      for (const [category, commands] of Object.entries(categories)) {
        logger.custom('CAT', `${category}: ${commands.length} commande(s)`);
      }
    }

    if (failedCommands.length > 0) {
      logger.warn(`${failedCommands.length} commandes en échec:`);
      failedCommands.forEach((failed) => {
        logger.error(`  - ${failed.file}: ${failed.error}`);
      });
    }

    return {
      loaded: loadedCommands,
      failed: failedCommands,
      total: commandFiles.length,
      categories
    };
  } catch (error) {
    logger.error(
      `Erreur critique lors du chargement des commandes: ${error.message}`
    );
    return {
      loaded: [],
      failed: [],
      total: 0,
      categories: {},
      criticalError: error.message
    };
  }
}

