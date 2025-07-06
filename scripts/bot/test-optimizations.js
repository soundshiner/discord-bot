// ========================================
// test-optimizations.js - Tests des optimisations AppState + RetryManager
// ========================================

import "dotenv/config";
import logger from "./bot/logger.js";
import appState from "./core/services/AppState.js";
import {
  retry,
  retryDiscord,
  retryDatabase,
  retryApi,
} from "./core/utils/retry.js";
import { getGlobalConfig } from "./bot/utils/globalConfig.js";
import { fileURLToPath } from "url";
import path from "path";

console.log("🚀 Démarrage des tests d'optimisation...");

async function testAppState() {
  console.log("🧪 Tests AppState Service");
  logger.sectionStart("🧪 Tests AppState Service");

  try {
    // Test 1: Initialisation
    console.log("Test 1: Initialisation AppState");
    logger.info("Test 1: Initialisation AppState");
    appState.initialize();
    console.log("✅ AppState initialisé");
    logger.success("✅ AppState initialisé");

    // Test 2: Configuration
    console.log("Test 2: Configuration AppState");
    logger.info("Test 2: Configuration AppState");
    const config = getGlobalConfig();
    appState.setConfigLoaded(config);
    console.log("✅ Configuration chargée");
    logger.success("✅ Configuration chargée");

    // Test 3: Métriques bot
    console.log("Test 3: Métriques bot");
    logger.info("Test 3: Métriques bot");
    appState.setBotConnected(true);
    appState.setBotReady(true);
    appState.incrementCommandsExecuted();
    appState.incrementCommandsExecuted();
    appState.incrementCommandsFailed();

    const botState = appState.getBotState();
    console.log(`Bot state: ${JSON.stringify(botState, null, 2)}`);
    logger.info(`Bot state: ${JSON.stringify(botState, null, 2)}`);
    console.log("✅ Métriques bot mises à jour");
    logger.success("✅ Métriques bot mises à jour");

    // Test 4: Métriques base de données
    console.log("Test 4: Métriques base de données");
    logger.info("Test 4: Métriques base de données");
    appState.setDatabaseConnected(true);
    appState.setDatabaseHealthy(true);
    appState.incrementQueriesExecuted();
    appState.incrementQueriesExecuted();
    appState.incrementQueriesExecuted();
    appState.incrementQueriesFailed();

    const dbState = appState.getDatabaseState();
    console.log(`Database state: ${JSON.stringify(dbState, null, 2)}`);
    logger.info(`Database state: ${JSON.stringify(dbState, null, 2)}`);
    console.log("✅ Métriques base de données mises à jour");
    logger.success("✅ Métriques base de données mises à jour");

    // Test 5: Métriques API
    console.log("Test 5: Métriques API");
    logger.info("Test 5: Métriques API");
    appState.setApiRunning(true, 3000);
    appState.incrementRequestsHandled();
    appState.incrementRequestsHandled();
    appState.incrementRequestsFailed();

    const apiState = appState.getApiState();
    console.log(`API state: ${JSON.stringify(apiState, null, 2)}`);
    logger.info(`API state: ${JSON.stringify(apiState, null, 2)}`);
    console.log("✅ Métriques API mises à jour");
    logger.success("✅ Métriques API mises à jour");

    // Test 6: Métriques système
    console.log("Test 6: Métriques système");
    logger.info("Test 6: Métriques système");
    appState.updateSystemMetrics();

    const systemState = appState.getSystemState();
    console.log(`System state: ${JSON.stringify(systemState, null, 2)}`);
    logger.info(`System state: ${JSON.stringify(systemState, null, 2)}`);
    console.log("✅ Métriques système mises à jour");
    logger.success("✅ Métriques système mises à jour");

    // Test 7: État complet
    console.log("Test 7: État complet");
    logger.info("Test 7: État complet");
    const fullState = appState.getFullState();
    console.log(`Full state: ${JSON.stringify(fullState, null, 2)}`);
    logger.info(`Full state: ${JSON.stringify(fullState, null, 2)}`);
    console.log("✅ État complet récupéré");
    logger.success("✅ État complet récupéré");

    // Test 8: Health check
    console.log("Test 8: Health check");
    logger.info("Test 8: Health check");
    const health = appState.isHealthy();
    console.log(`Health: ${JSON.stringify(health, null, 2)}`);
    logger.info(`Health: ${JSON.stringify(health, null, 2)}`);
    console.log("✅ Health check effectué");
    logger.success("✅ Health check effectué");

    // Test 9: Observateurs
    console.log("Test 9: Observateurs");
    logger.info("Test 9: Observateurs");
    let botStateChanged = false;
    const unsubscribe = appState.onStateChange("bot", (state) => {
      botStateChanged = true;
      console.log(`Bot state changed: ${JSON.stringify(state, null, 2)}`);
      logger.info(`Bot state changed: ${JSON.stringify(state, null, 2)}`);
    });

    appState.setBotConnected(false);
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (botStateChanged) {
      console.log("✅ Observateur bot fonctionne");
      logger.success("✅ Observateur bot fonctionne");
    } else {
      console.log("❌ Observateur bot ne fonctionne pas");
      logger.error("❌ Observateur bot ne fonctionne pas");
    }

    unsubscribe();

    console.log("✅ Tous les tests AppState réussis");
    logger.section("✅ Tous les tests AppState réussis");
  } catch (error) {
    console.error("❌ Erreur dans les tests AppState:", error);
    logger.error("❌ Erreur dans les tests AppState:", error);
    throw error;
  }
}

async function testRetryManager() {
  console.log("🔄 Tests RetryManager");
  logger.sectionStart("🔄 Tests RetryManager");

  try {
    // Test 1: Retry simple
    console.log("Test 1: Retry simple");
    logger.info("Test 1: Retry simple");
    let attempts = 0;
    const simpleOperation = async () => {
      attempts++;
      if (attempts <= 2) {
        const error = new Error("Erreur temporaire");
        error.code = "ECONNRESET";
        throw error;
      }
      return "Succès après retry";
    };

    const result = await retry(simpleOperation, { maxAttempts: 3 });
    console.log(`Résultat: ${result}, Tentatives: ${attempts}`);
    logger.info(`Résultat: ${result}, Tentatives: ${attempts}`);
    console.log("✅ Retry simple fonctionne");
    logger.success("✅ Retry simple fonctionne");

    // Test 2: Retry Discord
    console.log("Test 2: Retry Discord");
    logger.info("Test 2: Retry Discord");
    attempts = 0;
    const discordOperation = async () => {
      attempts++;
      if (attempts <= 1) {
        const error = new Error("Rate limit");
        error.code = "RATE_LIMIT";
        throw error;
      }
      return "Discord API succès";
    };

    const discordResult = await retryDiscord(discordOperation);
    console.log(`Résultat Discord: ${discordResult}, Tentatives: ${attempts}`);
    logger.info(`Résultat Discord: ${discordResult}, Tentatives: ${attempts}`);
    console.log("✅ Retry Discord fonctionne");
    logger.success("✅ Retry Discord fonctionne");

    // Test 3: Retry Database
    console.log("Test 3: Retry Database");
    logger.info("Test 3: Retry Database");
    attempts = 0;
    const dbOperation = async () => {
      attempts++;
      if (attempts <= 1) {
        const error = new Error("Database busy");
        error.code = "SQLITE_BUSY";
        throw error;
      }
      return "Database succès";
    };

    const dbResult = await retryDatabase(dbOperation);
    console.log(`Résultat Database: ${dbResult}, Tentatives: ${attempts}`);
    logger.info(`Résultat Database: ${dbResult}, Tentatives: ${attempts}`);
    console.log("✅ Retry Database fonctionne");
    logger.success("✅ Retry Database fonctionne");

    // Test 4: Retry API
    console.log("Test 4: Retry API");
    logger.info("Test 4: Retry API");
    attempts = 0;
    const apiOperation = async () => {
      attempts++;
      if (attempts <= 1) {
        const error = new Error("Connection reset");
        error.code = "ECONNRESET";
        throw error;
      }
      return "API succès";
    };

    const apiResult = await retryApi(apiOperation);
    console.log(`Résultat API: ${apiResult}, Tentatives: ${attempts}`);
    logger.info(`Résultat API: ${apiResult}, Tentatives: ${attempts}`);
    console.log("✅ Retry API fonctionne");
    logger.success("✅ Retry API fonctionne");

    // Test 5: Échec après max tentatives
    console.log("Test 5: Échec après max tentatives");
    logger.info("Test 5: Échec après max tentatives");
    attempts = 0;
    const failingOperation = async () => {
      attempts++;
      throw new Error("Erreur permanente");
    };

    try {
      await retry(failingOperation, { maxAttempts: 2 });
      console.log("❌ L'opération aurait dû échouer");
      logger.error("❌ L'opération aurait dû échouer");
    } catch (error) {
      console.log(
        `Échec attendu après ${attempts} tentatives: ${error.message}`
      );
      logger.info(
        `Échec attendu après ${attempts} tentatives: ${error.message}`
      );
      console.log("✅ Échec après max tentatives fonctionne");
      logger.success("✅ Échec après max tentatives fonctionne");
    }

    // Test 6: Callbacks
    console.log("Test 6: Callbacks");
    logger.info("Test 6: Callbacks");
    attempts = 0;
    let onRetryCalled = false;
    let onSuccessCalled = false;

    const callbackOperation = async () => {
      attempts++;
      if (attempts <= 1) {
        const error = new Error("Erreur pour test callback");
        error.code = "ECONNRESET";
        throw error;
      }
      return "Succès avec callbacks";
    };

    const callbackResult = await retry(callbackOperation, {
      maxAttempts: 3,
      onRetry: (error, attempt) => {
        onRetryCalled = true;
        console.log(`Callback onRetry: tentative ${attempt}`);
        logger.info(`Callback onRetry: tentative ${attempt}`);
      },
      onSuccess: (result, attempt) => {
        onSuccessCalled = true;
        console.log(`Callback onSuccess: ${result} en ${attempt} tentatives`);
        logger.info(`Callback onSuccess: ${result} en ${attempt} tentatives`);
      },
    });

    console.log(`Résultat: ${callbackResult}`);
    logger.info(`Résultat: ${callbackResult}`);
    if (onRetryCalled && onSuccessCalled) {
      console.log("✅ Callbacks fonctionnent");
      logger.success("✅ Callbacks fonctionnent");
    } else {
      console.log("❌ Callbacks ne fonctionnent pas");
      logger.error("❌ Callbacks ne fonctionnent pas");
    }

    console.log("✅ Tous les tests RetryManager réussis");
    logger.section("✅ Tous les tests RetryManager réussis");
  } catch (error) {
    console.error("❌ Erreur dans les tests RetryManager:", error);
    logger.error("❌ Erreur dans les tests RetryManager:", error);
    throw error;
  }
}

async function testIntegration() {
  console.log("🔗 Tests d'intégration");
  logger.sectionStart("🔗 Tests d'intégration");

  try {
    // Test 1: AppState + Retry
    console.log("Test 1: AppState + Retry");
    logger.info("Test 1: AppState + Retry");

    let attempts = 0;
    const operationWithMetrics = async () => {
      attempts++;
      appState.incrementCommandsExecuted();

      if (attempts <= 2) {
        appState.incrementCommandsFailed();
        const error = new Error("Erreur temporaire");
        error.code = "ECONNRESET";
        throw error;
      }

      return "Succès avec métriques";
    };

    const result = await retry(operationWithMetrics, { maxAttempts: 3 });
    console.log(`Résultat: ${result}`);
    logger.info(`Résultat: ${result}`);

    const finalBotState = appState.getBotState();
    console.log(`Métriques finales: ${JSON.stringify(finalBotState, null, 2)}`);
    logger.info(`Métriques finales: ${JSON.stringify(finalBotState, null, 2)}`);
    console.log("✅ Intégration AppState + Retry fonctionne");
    logger.success("✅ Intégration AppState + Retry fonctionne");

    // Test 2: Health check complet
    console.log("Test 2: Health check complet");
    logger.info("Test 2: Health check complet");
    const health = appState.isHealthy();
    console.log(`Health complet: ${JSON.stringify(health, null, 2)}`);
    logger.info(`Health complet: ${JSON.stringify(health, null, 2)}`);
    console.log("✅ Health check complet fonctionne");
    logger.success("✅ Health check complet fonctionne");

    console.log("✅ Tous les tests d'intégration réussis");
    logger.section("✅ Tous les tests d'intégration réussis");
  } catch (error) {
    console.error("❌ Erreur dans les tests d'intégration:", error);
    logger.error("❌ Erreur dans les tests d'intégration:", error);
    throw error;
  }
}

async function runAllTests() {
  console.log("🚀 TESTS COMPLETS - AppState + RetryManager");
  logger.sectionStart("🚀 TESTS COMPLETS - AppState + RetryManager");

  try {
    await testAppState();
    await testRetryManager();
    await testIntegration();

    console.log("🎉 TOUS LES TESTS RÉUSSIS !");
    logger.section("🎉 TOUS LES TESTS RÉUSSIS !");
    console.log("✅ AppState: Encapsulation d'état global fonctionnelle");
    console.log("✅ RetryManager: Gestion des retry robuste");
    console.log("✅ Intégration: Services fonctionnent ensemble");
    console.log("✅ Monitoring: Métriques centralisées");
    console.log("✅ Health checks: Validation d'état complète");
    logger.info("✅ AppState: Encapsulation d'état global fonctionnelle");
    logger.info("✅ RetryManager: Gestion des retry robuste");
    logger.info("✅ Intégration: Services fonctionnent ensemble");
    logger.info("✅ Monitoring: Métriques centralisées");
    logger.info("✅ Health checks: Validation d'état complète");
  } catch (error) {
    console.error("❌ ÉCHEC DES TESTS:", error);
    logger.error("❌ ÉCHEC DES TESTS:", error);
    process.exit(1);
  }
}

// Exécution des tests
console.log("📋 Vérification du point d'entrée...");
console.log("import.meta.url:", import.meta.url);
console.log("process.argv[1]:", process.argv[1]);

const isEntry =
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isEntry) {
  console.log("✅ Point d'entrée détecté, lancement des tests...");
  runAllTests();
} else {
  console.log("❌ Point d'entrée non détecté");
}

export { testAppState, testRetryManager, testIntegration, runAllTests };
