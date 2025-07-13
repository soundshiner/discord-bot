#!/usr/bin/env node

// ========================================
// scripts/security/audit.js - Audit de sécurité automatisé
// ========================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    switch (type) {
      case "error":
        console.log(chalk.red(`❌ [${timestamp}] ${message}`));
        break;
      case "warning":
        console.log(chalk.yellow(`⚠️  [${timestamp}] ${message}`));
        break;
      case "success":
        console.log(chalk.green(`✅ [${timestamp}] ${message}`));
        break;
      default:
        console.log(chalk.blue(`ℹ️  [${timestamp}] ${message}`));
    }
  }

  // Vérifier les permissions des fichiers sensibles
  checkFilePermissions() {
    this.log("Vérification des permissions des fichiers...");

    const sensitiveFiles = [
      ".env",
      ".env.dev",
      ".env.prod",
      "databases/",
      "logs/",
    ];

    for (const file of sensitiveFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = stats.mode.toString(8);

          // Vérifier que les fichiers ne sont pas trop permissifs
          if (mode.endsWith("777") || mode.endsWith("666")) {
            this.issues.push(`Fichier trop permissif: ${file} (${mode})`);
            this.log(`Fichier trop permissif: ${file} (${mode})`, "error");
          } else {
            this.successes.push(`Permissions OK: ${file} (${mode})`);
            this.log(`Permissions OK: ${file} (${mode})`, "success");
          }
        } catch (error) {
          this.warnings.push(`Erreur lecture ${file}: ${error.message}`);
          this.log(`Erreur lecture ${file}: ${error.message}`, "warning");
        }
      }
    }
  }

  // Vérifier les variables d'environnement
  checkEnvironmentVariables() {
    this.log("Vérification des variables d'environnement...");

    const requiredVars = [
      "DISCORD_TOKEN",
      "ADMIN_ROLE_ID",
      "VOICE_CHANNEL_ID",
      "PLAYLIST_CHANNEL_ID",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      this.issues.push(`Variables manquantes: ${missingVars.join(", ")}`);
      this.log(`Variables manquantes: ${missingVars.join(", ")}`, "error");
    } else {
      this.successes.push("Toutes les variables requises sont définies");
      this.log("Toutes les variables requises sont définies", "success");
    }

    // Vérifier la force des tokens
    if (process.env.DISCORD_TOKEN) {
      if (process.env.DISCORD_TOKEN.length < 50) {
        this.warnings.push("Token Discord semble trop court");
        this.log("Token Discord semble trop court", "warning");
      } else {
        this.successes.push("Token Discord semble valide");
        this.log("Token Discord semble valide", "success");
      }
    }
  }

  // Vérifier les dépendances
  checkDependencies() {
    this.log("Vérification des dépendances...");

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
      );
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Vérifier les versions des packages critiques
      const criticalPackages = {
        "helmet": "8.0.0",
        "express-rate-limit": "7.0.0",
        "cors": "2.8.0",
        "zod": "3.0.0",
      };

      for (const [pkg, minVersion] of Object.entries(criticalPackages)) {
        if (dependencies[pkg]) {
          const version = dependencies[pkg].replace(/^[\^~]/, "");
          if (this.compareVersions(version, minVersion) < 0) {
            this.warnings.push(
              `Package ${pkg} (${version}) peut être obsolète`
            );
            this.log(
              `Package ${pkg} (${version}) peut être obsolète`,
              "warning"
            );
          } else {
            this.successes.push(`Package ${pkg} (${version}) est à jour`);
            this.log(`Package ${pkg} (${version}) est à jour`, "success");
          }
        }
      }
    } catch (error) {
      this.issues.push(`Erreur lecture package.json: ${error.message}`);
      this.log(`Erreur lecture package.json: ${error.message}`, "error");
    }
  }

  // Vérifier la configuration de sécurité
  checkSecurityConfig() {
    this.log("Vérification de la configuration de sécurité...");

    // Vérifier que NODE_ENV est défini
    if (!process.env.NODE_ENV) {
      this.warnings.push("NODE_ENV non défini (défaut: development)");
      this.log("NODE_ENV non défini (défaut: development)", "warning");
    } else if (process.env.NODE_ENV === "production") {
      this.successes.push("Environnement de production détecté");
      this.log("Environnement de production détecté", "success");
    }

    // Vérifier les ports
    const apiPort = process.env.API_PORT || "3000";
    if (apiPort === "3000" && process.env.NODE_ENV === "production") {
      this.warnings.push("Port par défaut en production (3000)");
      this.log("Port par défaut en production (3000)", "warning");
    }
  }

  // Comparer les versions
  compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  // Générer le rapport
  generateReport() {
    this.log("\n" + "=".repeat(50));
    this.log("RAPPORT D'AUDIT DE SÉCURITÉ");
    this.log("=".repeat(50));

    this.log(`\n✅ Succès: ${this.successes.length}`);
    this.successes.forEach((success) => this.log(`  • ${success}`, "success"));

    this.log(`\n⚠️  Avertissements: ${this.warnings.length}`);
    this.warnings.forEach((warning) => this.log(`  • ${warning}`, "warning"));

    this.log(`\n❌ Problèmes: ${this.issues.length}`);
    this.issues.forEach((issue) => this.log(`  • ${issue}`, "error"));

    // Score de sécurité
    const totalChecks =
      this.successes.length + this.warnings.length + this.issues.length;
    const score = Math.round(
      ((this.successes.length - this.issues.length) / totalChecks) * 100
    );

    this.log(`\n📊 Score de sécurité: ${score}/100`);

    if (score >= 80) {
      this.log("🎉 Configuration de sécurité excellente!", "success");
    } else if (score >= 60) {
      this.log(
        "⚠️  Configuration de sécurité acceptable, améliorations recommandées",
        "warning"
      );
    } else {
      this.log(
        "🚨 Configuration de sécurité critique, corrections urgentes requises",
        "error"
      );
    }

    return {
      score,
      issues: this.issues,
      warnings: this.warnings,
      successes: this.successes,
    };
  }

  // Exécuter l'audit complet
  async run() {
    this.log("Démarrage de l'audit de sécurité...");

    this.checkFilePermissions();
    this.checkEnvironmentVariables();
    this.checkDependencies();
    this.checkSecurityConfig();

    return this.generateReport();
  }
}

// Exécuter l'audit
const auditor = new SecurityAuditor();
auditor
  .run()
  .then((report) => {
    process.exit(report.score >= 60 ? 0 : 1);
  })
  .catch((error) => {
    console.error("Erreur lors de l'audit:", error);
    process.exit(1);
  });
