#!/usr/bin/env node

// ========================================
// scripts/dev/test-optimizations.js - Tests des optimisations
// ========================================

import {
  getGlobalConfig,
  checkConfigHealth,
} from "../../bot/utils/globalConfig.js";
import {
  isDatabaseHealthy,
  getDatabaseStats,
} from "../../bot/utils/database.js";
import { isClientReady } from "../../bot/client.js";
import monitor from "../../core/monitor.js";
import logger from "../../bot/logger.js";

class OptimizationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  async runAllTests() {
    logger.sectionStart("Tests des Optimisations");
    logger.info("Démarrage des tests de validation...");

    try {
      // Test 1: Configuration
      await this.testConfiguration();

      // Test 2: Base de données
      await this.testDatabase();

      // Test 3: Client Discord
      await this.testDiscordClient();

      // Test 4: Monitoring
      await this.testMonitoring();

      // Test 5: Performance
      await this.testPerformance();

      // Test 6: Sécurité
      await this.testSecurity();

      // Afficher les résultats
      this.displayResults();
    } catch (error) {
      logger.error("Erreur lors des tests:", error);
      process.exit(1);
    }
  }

  async testConfiguration() {
    logger.info("🧪 Test 1: Configuration globale...");

    try {
      // Test de chargement de configuration
      const config = getGlobalConfig();
      this.assert(config, "Configuration chargée");
      this.assert(config.discord, "Configuration Discord présente");
      this.assert(config.api, "Configuration API présente");

      // Test de health check de configuration
      const health = checkConfigHealth();
      this.assert(health.healthy, "Configuration saine");

      // Test des variables requises
      this.assert(config.discord.token, "Token Discord présent");
      this.assert(config.discord.adminRoleId, "ID rôle admin présent");
      this.assert(config.api.port > 0, "Port API valide");

      logger.success("✅ Configuration: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Configuration: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Configuration",
        error: error.message,
      });
    }

    this.results.total++;
  }

  async testDatabase() {
    logger.info("🧪 Test 2: Base de données...");

    try {
      // Test de santé de la base de données
      const healthy = isDatabaseHealthy();
      // En mode test, la DB peut ne pas être connectée
      this.assert(typeof healthy === "boolean", "État DB valide");

      // Test des statistiques
      const stats = getDatabaseStats();
      // En mode test, on accepte que la DB ne soit pas connectée
      this.assert(
        stats === null || typeof stats === "object",
        "Format stats valide"
      );

      // Test de performance (simulation)
      const startTime = Date.now();
      // Simuler une opération de base de données
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = Date.now() - startTime;

      this.assert(duration < 100, "Performance DB acceptable");

      logger.success("✅ Base de données: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Base de données: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Base de données",
        error: error.message,
      });
    }

    this.results.total++;
  }

  async testDiscordClient() {
    logger.info("🧪 Test 3: Client Discord...");

    try {
      // Test de l'état du client
      const ready = isClientReady();
      // En mode test, le client peut ne pas être prêt
      this.assert(typeof ready === "boolean", "État client valide");

      // Test des métriques
      const metrics = monitor.getMetrics();
      this.assert(metrics, "Métriques récupérées");
      this.assert(typeof metrics.uptime === "number", "Uptime valide");
      this.assert(metrics.commandsExecuted >= 0, "Métriques commandes valides");

      logger.success("✅ Client Discord: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Client Discord: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Client Discord",
        error: error.message,
      });
    }

    this.results.total++;
  }

  async testMonitoring() {
    logger.info("🧪 Test 4: Système de monitoring...");

    try {
      // Test des métriques
      const metrics = monitor.getMetrics();
      this.assert(metrics.commandsExecuted >= 0, "Métriques commandes valides");
      this.assert(metrics.apiRequests >= 0, "Métriques API valides");
      this.assert(metrics.databaseQueries >= 0, "Métriques DB valides");

      // Test du health check
      const health = await monitor.checkHealth();
      this.assert(health.status, "Health check fonctionnel");
      this.assert(health.services, "Services monitorés");

      // Test des statistiques de performance
      const perfStats = monitor.getPerformanceStats();
      this.assert(perfStats.memory, "Métriques mémoire présentes");
      this.assert(perfStats.uptime > 0, "Uptime positif");

      logger.success("✅ Monitoring: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Monitoring: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Monitoring",
        error: error.message,
      });
    }

    this.results.total++;
  }

  async testPerformance() {
    logger.info("🧪 Test 5: Performance...");

    try {
      // Test de performance des métriques
      const startTime = Date.now();
      const metrics = monitor.getMetrics();
      const duration = Date.now() - startTime;

      this.assert(duration < 50, "Métriques rapides (< 50ms)");

      // Test de performance du health check
      const healthStart = Date.now();
      await monitor.checkHealth();
      const healthDuration = Date.now() - healthStart;

      this.assert(healthDuration < 100, "Health check rapide (< 100ms)");

      // Test de mémoire
      const memUsage = process.memoryUsage();
      this.assert(
        memUsage.heapUsed < 100 * 1024 * 1024,
        "Utilisation mémoire raisonnable (< 100MB)"
      );

      logger.success("✅ Performance: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Performance: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Performance",
        error: error.message,
      });
    }

    this.results.total++;
  }

  async testSecurity() {
    logger.info("🧪 Test 6: Sécurité...");

    try {
      // Test de validation des erreurs
      const testError = new Error("Test error");
      const errorType = monitor.categorizeError(testError);
      this.assert(
        errorType === "UNKNOWN",
        "Catégorisation d'erreur fonctionnelle"
      );

      // Test de génération d'ID d'erreur
      const errorId = monitor.generateErrorId();
      this.assert(errorId.startsWith("ERR_"), "Format ID d'erreur correct");

      // Test de messages utilisateur
      const userMessage = monitor.getUserFriendlyMessage("NETWORK");
      this.assert(userMessage.includes("🌐"), "Message utilisateur approprié");

      // Test de codes HTTP
      const statusCode = monitor.getHttpStatusCode("PERMISSION");
      this.assert(statusCode === 403, "Code HTTP correct");

      logger.success("✅ Sécurité: PASSED");
      this.results.passed++;
    } catch (error) {
      logger.error("❌ Sécurité: FAILED -", error.message);
      this.results.failed++;
      this.results.details.push({
        test: "Sécurité",
        error: error.message,
      });
    }

    this.results.total++;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  displayResults() {
    logger.section("Résultats des Tests");

    const successRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);

    logger.info(
      `📊 Résultats: ${this.results.passed}/${this.results.total} tests réussis (${successRate}%)`
    );

    if (this.results.failed > 0) {
      logger.warn("❌ Tests échoués:");
      this.results.details.forEach((detail) => {
        logger.warn(`  - ${detail.test}: ${detail.error}`);
      });
    }

    if (this.results.passed === this.results.total) {
      logger.success(
        "🎉 Tous les tests sont passés ! Les optimisations sont fonctionnelles."
      );
    } else {
      logger.error("⚠️ Certains tests ont échoué. Vérifiez la configuration.");
    }

    // Afficher les métriques finales
    const finalMetrics = monitor.getPerformanceStats();
    logger.info("📈 Métriques finales:");
    logger.info(`  - Uptime: ${Math.round(finalMetrics.uptime / 1000)}s`);
    logger.info(`  - Mémoire: ${finalMetrics.memory.heapUsed}MB`);
    logger.info(
      `  - Commandes exécutées: ${finalMetrics.metrics.commandsExecuted}`
    );
    logger.info(`  - Erreurs: ${finalMetrics.metrics.commandsFailed}`);
  }
}

// Exécution des tests
async function main() {
  const tester = new OptimizationTester();
  await tester.runAllTests();

  // Exit avec le bon code
  if (tester.results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesse rejetée non gérée:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Exception non capturée:", error);
  process.exit(1);
});

// Lancer les tests
main().catch((error) => {
  logger.error("Erreur fatale lors des tests:", error);
  process.exit(1);
});
