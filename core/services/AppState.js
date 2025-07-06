// ========================================
// core/services/AppState.js - Service d'état global sécurisé
// ========================================

import logger from "../../bot/logger.js";

class AppStateService {
  #state = {
    // État du bot
    bot: {
      isReady: false,
      isConnected: false,
      startTime: null,
      uptime: 0,
      commandsExecuted: 0,
      commandsFailed: 0,
    },

    // État de la base de données
    database: {
      isConnected: false,
      isHealthy: false,
      lastCheck: null,
      queriesExecuted: 0,
      queriesFailed: 0,
    },

    // État de l'API
    api: {
      isRunning: false,
      port: null,
      startTime: null,
      requestsHandled: 0,
      requestsFailed: 0,
    },

    // Configuration
    config: {
      isLoaded: false,
      environment: null,
      version: null,
      lastReload: null,
    },

    // Métriques système
    system: {
      memoryUsage: {},
      cpuUsage: {},
      lastUpdate: null,
    },
  };

  #listeners = new Map();
  #isInitialized = false;

  constructor() {
    if (AppStateService._instance) {
      throw new Error("AppStateService: Utilisez getInstance() !");
    }
    AppStateService._instance = this;
  }

  static getInstance() {
    if (!AppStateService._instance) {
      AppStateService._instance = new AppStateService();
    }
    return AppStateService._instance;
  }

  // === GETTERS SÉCURISÉS ===

  getBotState() {
    return { ...this.#state.bot };
  }

  getDatabaseState() {
    return { ...this.#state.database };
  }

  getApiState() {
    return { ...this.#state.api };
  }

  getConfigState() {
    return { ...this.#state.config };
  }

  getSystemState() {
    return { ...this.#state.system };
  }

  getFullState() {
    return {
      bot: this.getBotState(),
      database: this.getDatabaseState(),
      api: this.getApiState(),
      config: this.getConfigState(),
      system: this.getSystemState(),
    };
  }

  // === SETTERS SÉCURISÉS ===

  setBotReady(isReady) {
    this.#state.bot.isReady = isReady;
    if (isReady && !this.#state.bot.startTime) {
      this.#state.bot.startTime = Date.now();
    }
    this.#notifyListeners("bot", this.getBotState());
    logger.info(`Bot state updated: ready=${isReady}`);
  }

  setBotConnected(isConnected) {
    this.#state.bot.isConnected = isConnected;
    this.#notifyListeners("bot", this.getBotState());
  }

  incrementCommandsExecuted() {
    this.#state.bot.commandsExecuted++;
    this.#updateBotUptime();
  }

  incrementCommandsFailed() {
    this.#state.bot.commandsFailed++;
    this.#updateBotUptime();
  }

  setDatabaseConnected(isConnected) {
    this.#state.database.isConnected = isConnected;
    this.#state.database.lastCheck = Date.now();
    this.#notifyListeners("database", this.getDatabaseState());
  }

  setDatabaseHealthy(isHealthy) {
    this.#state.database.isHealthy = isHealthy;
    this.#state.database.lastCheck = Date.now();
    this.#notifyListeners("database", this.getDatabaseState());
  }

  incrementQueriesExecuted() {
    this.#state.database.queriesExecuted++;
  }

  incrementQueriesFailed() {
    this.#state.database.queriesFailed++;
  }

  setApiRunning(isRunning, port = null) {
    this.#state.api.isRunning = isRunning;
    if (isRunning && !this.#state.api.startTime) {
      this.#state.api.startTime = Date.now();
      this.#state.api.port = port;
    }
    this.#notifyListeners("api", this.getApiState());
  }

  incrementRequestsHandled() {
    this.#state.api.requestsHandled++;
  }

  incrementRequestsFailed() {
    this.#state.api.requestsFailed++;
  }

  setConfigLoaded(config) {
    this.#state.config.isLoaded = true;
    this.#state.config.environment = config.NODE_ENV;
    this.#state.config.version = process.env.npm_package_version || "2.0.0";
    this.#state.config.lastReload = Date.now();
    this.#notifyListeners("config", this.getConfigState());
  }

  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.#state.system.memoryUsage = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    };
    this.#state.system.lastUpdate = Date.now();
    this.#notifyListeners("system", this.getSystemState());
  }

  // === MÉTHODES UTILITAIRES ===

  #updateBotUptime() {
    if (this.#state.bot.startTime) {
      this.#state.bot.uptime = Date.now() - this.#state.bot.startTime;
    }
  }

  #notifyListeners(component, state) {
    if (this.#listeners.has(component)) {
      this.#listeners.get(component).forEach((listener) => {
        try {
          listener(state);
        } catch (error) {
          logger.error(`Erreur dans le listener ${component}:`, error);
        }
      });
    }
  }

  // === OBSERVATEURS ===

  onStateChange(component, callback) {
    if (!this.#listeners.has(component)) {
      this.#listeners.set(component, []);
    }
    this.#listeners.get(component).push(callback);

    // Retourner une fonction pour se désabonner
    return () => {
      const listeners = this.#listeners.get(component);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // === VALIDATION ET HEALTH CHECK ===

  isHealthy() {
    const health = {
      overall: true,
      components: {},
      timestamp: new Date().toISOString(),
    };

    // Vérifier le bot
    health.components.bot = {
      healthy: this.#state.bot.isConnected && this.#state.bot.isReady,
      details: {
        connected: this.#state.bot.isConnected,
        ready: this.#state.bot.isReady,
        uptime: this.#state.bot.uptime,
      },
    };

    // Vérifier la base de données
    health.components.database = {
      healthy:
        this.#state.database.isConnected && this.#state.database.isHealthy,
      details: {
        connected: this.#state.database.isConnected,
        healthy: this.#state.database.isHealthy,
        lastCheck: this.#state.database.lastCheck,
      },
    };

    // Vérifier l'API
    health.components.api = {
      healthy: this.#state.api.isRunning,
      details: {
        running: this.#state.api.isRunning,
        port: this.#state.api.port,
        startTime: this.#state.api.startTime,
      },
    };

    // Vérifier la configuration
    health.components.config = {
      healthy: this.#state.config.isLoaded,
      details: {
        loaded: this.#state.config.isLoaded,
        environment: this.#state.config.environment,
        version: this.#state.config.version,
      },
    };

    // Déterminer l'état global
    health.overall = Object.values(health.components).every((c) => c.healthy);

    return health;
  }

  // === RÉINITIALISATION (TESTS UNIQUEMENT) ===

  _resetForTests() {
    this.#state = {
      bot: {
        isReady: false,
        isConnected: false,
        startTime: null,
        uptime: 0,
        commandsExecuted: 0,
        commandsFailed: 0,
      },
      database: {
        isConnected: false,
        isHealthy: false,
        lastCheck: null,
        queriesExecuted: 0,
        queriesFailed: 0,
      },
      api: {
        isRunning: false,
        port: null,
        startTime: null,
        requestsHandled: 0,
        requestsFailed: 0,
      },
      config: {
        isLoaded: false,
        environment: null,
        version: null,
        lastReload: null,
      },
      system: { memoryUsage: {}, cpuUsage: {}, lastUpdate: null },
    };
    this.#listeners.clear();
    this.#isInitialized = false;
  }

  // === DÉMARRAGE ===

  initialize() {
    if (this.#isInitialized) {
      logger.warn("AppState déjà initialisé");
      return;
    }

    this.#isInitialized = true;
    this.updateSystemMetrics();

    // Mettre à jour les métriques système périodiquement
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Toutes les 30 secondes

    logger.success("AppState service initialisé");
  }
}

// Instance singleton
const appState = AppStateService.getInstance();

// Exports pour compatibilité
export function getAppState() {
  return appState;
}

export function getBotState() {
  return appState.getBotState();
}

export function getDatabaseState() {
  return appState.getDatabaseState();
}

export function getApiState() {
  return appState.getApiState();
}

export function getFullState() {
  return appState.getFullState();
}

export function isAppHealthy() {
  return appState.isHealthy();
}

// Pour les tests uniquement
// export function _resetAppStateForTests() { appState._resetForTests(); }

export default appState;
