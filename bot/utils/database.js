// ========================================
// bot/utils/database.js - Gestionnaire de base de données optimisé
// ========================================

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.dbPath = path.join(__dirname, "../../databases/suggestions.sqlite");
    this.preparedStatements = new Map();
  }

  /**
   * Initialise la connexion à la base de données
   */
  async connect() {
    try {
      if (this.isConnected && this.db) {
        logger.warn("Base de données déjà connectée");
        return this.db;
      }

      // Créer le répertoire si nécessaire
      const dbDir = path.dirname(this.dbPath);
      await import("fs").then((fs) => {
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      });

      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === "dev" ? console.log : null,
        // Optimisations de performance
        pragma: {
          journal_mode: "WAL",
          synchronous: "NORMAL",
          cache_size: -64000, // 64MB
          temp_store: "MEMORY",
          mmap_size: 268435456, // 256MB
          page_size: 4096,
        },
      });

      // Vérifier la connexion
      this.db.prepare("SELECT 1").get();

      this.isConnected = true;
      logger.success("Base de données SQLite connectée avec succès");

      // Initialiser les tables
      await this.initializeTables();

      return this.db;
    } catch (error) {
      this.isConnected = false;
      logger.error(
        "Erreur critique lors de la connexion à la base de données:",
        error
      );
      throw new Error(
        `Échec de la connexion à la base de données: ${error.message}`
      );
    }
  }

  /**
   * Initialise les tables de la base de données
   */
  async initializeTables() {
    try {
      // Table des suggestions avec index optimisés
      this.db
        .prepare(
          `
        CREATE TABLE IF NOT EXISTS suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          username TEXT NOT NULL,
          titre TEXT NOT NULL,
          artiste TEXT NOT NULL,
          lien TEXT,
          genre TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
        )
        .run();

      // Table pour le DJ actif
      this.db
        .prepare(
          `
        CREATE TABLE IF NOT EXISTS dj_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL UNIQUE,
          username TEXT NOT NULL,
          activatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
        )
        .run();

      // Créer les index pour optimiser les performances
      this.db
        .prepare(
          "CREATE INDEX IF NOT EXISTS idx_suggestions_userId ON suggestions(userId)"
        )
        .run();
      this.db
        .prepare(
          "CREATE INDEX IF NOT EXISTS idx_suggestions_createdAt ON suggestions(createdAt)"
        )
        .run();
      this.db
        .prepare(
          "CREATE INDEX IF NOT EXISTS idx_dj_status_userId ON dj_status(userId)"
        )
        .run();

      // Préparer les requêtes fréquemment utilisées
      this.prepareStatements();

      logger.info("Tables et index de la base de données initialisés");
    } catch (error) {
      logger.error("Erreur lors de l'initialisation des tables:", error);
      throw error;
    }
  }

  /**
   * Prépare les requêtes fréquemment utilisées
   */
  prepareStatements() {
    try {
      this.preparedStatements.set(
        "insertSuggestion",
        this.db.prepare(`
          INSERT INTO suggestions (userId, username, titre, artiste, lien, genre)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
      );

      this.preparedStatements.set(
        "getSuggestionsByUser",
        this.db.prepare(`
          SELECT * FROM suggestions 
          WHERE userId = ? 
          ORDER BY createdAt DESC 
          LIMIT ?
        `)
      );

      this.preparedStatements.set(
        "getAllSuggestions",
        this.db.prepare(`
          SELECT * FROM suggestions 
          ORDER BY createdAt DESC 
          LIMIT ?
        `)
      );

      this.preparedStatements.set(
        "updateDjStatus",
        this.db.prepare(`
          INSERT OR REPLACE INTO dj_status (userId, username, updatedAt)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `)
      );

      this.preparedStatements.set(
        "getCurrentDj",
        this.db.prepare(`
          SELECT * FROM dj_status 
          ORDER BY updatedAt DESC 
          LIMIT 1
        `)
      );

      logger.debug("Requêtes préparées initialisées");
    } catch (error) {
      logger.error("Erreur lors de la préparation des requêtes:", error);
      throw error;
    }
  }

  /**
   * Exécute une requête avec gestion d'erreur
   */
  executeQuery(statementName, params = []) {
    try {
      if (!this.isConnected || !this.db) {
        throw new Error("Base de données non connectée");
      }

      const statement = this.preparedStatements.get(statementName);
      if (!statement) {
        throw new Error(`Requête préparée '${statementName}' non trouvée`);
      }

      return statement.run(params);
    } catch (error) {
      logger.error(
        `Erreur lors de l'exécution de la requête ${statementName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Récupère des données avec gestion d'erreur
   */
  getData(statementName, params = []) {
    try {
      if (!this.isConnected || !this.db) {
        throw new Error("Base de données non connectée");
      }

      const statement = this.preparedStatements.get(statementName);
      if (!statement) {
        throw new Error(`Requête préparée '${statementName}' non trouvée`);
      }

      return statement.all(params);
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération de données ${statementName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Ferme proprement la connexion à la base de données
   */
  async disconnect() {
    try {
      if (this.db && this.isConnected) {
        // Fermer les requêtes préparées
        this.preparedStatements.clear();

        // Fermer la connexion
        this.db.close();
        this.db = null;
        this.isConnected = false;

        logger.success("Connexion à la base de données fermée proprement");
      }
    } catch (error) {
      logger.error("Erreur lors de la fermeture de la base de données:", error);
      throw error;
    }
  }

  /**
   * Vérifie l'état de la connexion
   */
  isHealthy() {
    try {
      if (!this.db || !this.isConnected) {
        return false;
      }

      // Test de connexion
      this.db.prepare("SELECT 1").get();
      return true;
    } catch (error) {
      logger.warn("Base de données non saine:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Récupère les statistiques de la base de données
   */
  getStats() {
    try {
      if (!this.db || !this.isConnected) {
        return null;
      }

      const suggestionsCount = this.db
        .prepare("SELECT COUNT(*) as count FROM suggestions")
        .get();
      const djCount = this.db
        .prepare("SELECT COUNT(*) as count FROM dj_status")
        .get();

      return {
        suggestions: suggestionsCount.count,
        djStatus: djCount.count,
        connected: this.isConnected,
        path: this.dbPath,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques:", error);
      return null;
    }
  }
}

// Instance singleton
const databaseManager = new DatabaseManager();

// Fonctions d'export pour compatibilité
export async function getDatabase() {
  if (!databaseManager.isConnected) {
    await databaseManager.connect();
  }
  return databaseManager.db;
}

export async function disconnectDatabase() {
  return databaseManager.disconnect();
}

export function isDatabaseHealthy() {
  return databaseManager.isHealthy();
}

export function getDatabaseStats() {
  return databaseManager.getStats();
}

// Export pour compatibilité avec l'ancien code
export { databaseManager as db };

