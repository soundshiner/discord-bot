// ========================================
// tests/performance/logger.test.js - Tests de performance du logger
// ========================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import logger from "../../bot/logger.js";
import fs from "fs/promises";
import path from "path";

describe("Performance Logger", () => {
  let consoleSpy;
  let testLogDir;

  beforeEach(async () => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    };

    // Créer un dossier de test pour les logs
    testLogDir = "./test-logs";
    try {
      await fs.mkdir(testLogDir, { recursive: true });
    } catch (error) {
      // Ignorer si le dossier existe déjà
    }
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    // Nettoyer les fichiers de test
    try {
      const files = await fs.readdir(testLogDir);
      for (const file of files) {
        await fs.unlink(path.join(testLogDir, file));
      }
      await fs.rmdir(testLogDir);
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  });

  describe("Méthodes de base", () => {
    it("should have all required methods", () => {
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("trace");
      expect(logger).toHaveProperty("success");
      expect(logger).toHaveProperty("custom");
      expect(logger).toHaveProperty("section");
      expect(logger).toHaveProperty("sectionStart");
      expect(logger).toHaveProperty("summary");
    });

    it("should log messages with proper formatting", async () => {
      const testMessage = "Test log message";
      const testData = { key: "value" };

      await logger.info(testMessage, testData);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[INFO]",
        testMessage,
        testData
      );
    });

    it("should handle different log levels", async () => {
      const levels = ["error", "warn", "info", "debug", "trace"];

      for (const level of levels) {
        await logger[level](`Test ${level} message`);
      }

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledTimes(3); // info, debug, trace
    });
  });

  describe("Performance", () => {
    it("should handle high volume logging efficiently", async () => {
      const startTime = Date.now();
      const logCount = 1000;

      // Logger 1000 messages rapidement
      const promises = [];
      for (let i = 0; i < logCount; i++) {
        promises.push(logger.info(`Test message ${i}`));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Vérifier que le logging est rapide (< 1 seconde pour 1000 logs)
      expect(duration).toBeLessThan(1000);
      expect(consoleSpy.log).toHaveBeenCalledTimes(logCount);
    });

    it("should batch logs for better performance", async () => {
      // Simuler l'activation du batching
      const originalBatchEnabled = process.env.LOG_BATCH;
      process.env.LOG_BATCH = "true";

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(logger.info(`Batch test ${i}`));
      }

      await Promise.all(promises);

      // Vérifier que les logs sont traités
      expect(consoleSpy.log).toHaveBeenCalled();

      // Restaurer la configuration
      if (originalBatchEnabled) {
        process.env.LOG_BATCH = originalBatchEnabled;
      } else {
        delete process.env.LOG_BATCH;
      }
    });
  });

  describe("Métriques", () => {
    it("should track logging metrics", async () => {
      // Logger quelques messages
      await logger.info("Test metric 1");
      await logger.warn("Test metric 2");
      await logger.error("Test metric 3");

      const metrics = logger.getMetrics();

      expect(metrics).toHaveProperty("totalLogs");
      expect(metrics).toHaveProperty("logsByLevel");
      expect(metrics).toHaveProperty("performance");

      expect(metrics.totalLogs).toBeGreaterThan(0);
      expect(metrics.logsByLevel.info).toBeGreaterThan(0);
      expect(metrics.logsByLevel.warn).toBeGreaterThan(0);
      expect(metrics.logsByLevel.error).toBeGreaterThan(0);
    });

    it("should track performance metrics", async () => {
      const startTime = Date.now();

      await logger.info("Performance test");

      const metrics = logger.getMetrics();

      expect(metrics.performance).toHaveProperty("avgWriteTime");
      expect(metrics.performance).toHaveProperty("totalWriteTime");
      expect(metrics.performance).toHaveProperty("writeCount");

      expect(metrics.performance.writeCount).toBeGreaterThan(0);
      expect(metrics.performance.avgWriteTime).toBeGreaterThan(0);
    });
  });

  describe("Formatage", () => {
    it("should format structured logs in production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      // Forcer la réinitialisation du logger pour prendre en compte le nouvel environnement
      await logger.info("Structured test", { data: "value" });

      // Vérifier que le formatage structuré est utilisé (JSON string)
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should format colored logs in development", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      await logger.info("Colored test");

      // Vérifier que les arguments sont séparés en développement
      expect(consoleSpy.log).toHaveBeenCalledWith("[INFO]", "Colored test");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Gestion des erreurs", () => {
    it("should handle logging errors gracefully", async () => {
      // Simuler une erreur d'écriture de fichier
      const mockAppendFile = vi
        .spyOn(fs, "appendFile")
        .mockRejectedValue(new Error("Write error"));

      // Le logger devrait continuer à fonctionner malgré l'erreur
      await logger.info("Error test");

      expect(consoleSpy.log).toHaveBeenCalled();
      mockAppendFile.mockRestore();
    });

    it("should provide synchronous fallback methods", () => {
      const testMessage = "Sync test message";

      logger.errorSync(testMessage);
      logger.warnSync(testMessage);
      logger.infoSync(testMessage);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]")
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]")
      );
    });
  });

  describe("Compatibilité", () => {
    it("should maintain backward compatibility", async () => {
      // Tester les anciennes méthodes
      await logger.success("Success test");
      await logger.infocmd("Command test");
      await logger.custom("CUSTOM", "Custom test");
      await logger.bot("Bot test");
      await logger.command("Command test");
      await logger.event("Event test");
      await logger.task("Task test");
      await logger.api("API test");

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it("should handle section formatting", async () => {
      await logger.section("Test Section");
      await logger.sectionStart("Test Section Start");
      await logger.summary("Test Summary");

      // Vérifier que les sections sont loggées avec des arguments séparés
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[INFO]",
        expect.stringContaining("━")
      );
    });
  });
});
