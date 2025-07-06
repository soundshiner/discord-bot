// scripts/checkSecrets.js

import { execSync } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";

const scanForSecrets = () => {
  console.log(
    chalk.blue(
      "\n🔐 Vérification de la présence de secrets dans les fichiers staged..."
    )
  );

  // Expressions régulières à surveiller (ajuste au besoin)
  const patterns = [
    /AWS[_-]?SECRET[_-]?ACCESS[_-]?KEY/i,
    /API[_-]?KEY/i,
    /PRIVATE[_-]?KEY/i,
    /DISCORD[_-]?TOKEN/i,
    /TOKEN\s*=\s*['"]?[A-Za-z0-9_\-]{24,}\.?[A-Za-z0-9_\-]{6,}\.?[A-Za-z0-9_\-]{27,}/,
    /-----BEGIN (RSA|PRIVATE) KEY-----/,
  ];

  let filesToCheck;

  try {
    filesToCheck = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    })
      .split("\n")
      .filter((file) => file && /\.(js|ts|json|env|yml|yaml)$/i.test(file));
  } catch (error) {
    console.error(
      chalk.red("❌ Impossible de récupérer la liste des fichiers staged.")
    );
    return false;
  }

  let secretDetected = false;

  for (const file of filesToCheck) {
    if (!existsSync(file)) continue;

    let content;
    try {
      content = execSync(`git show :${file}`, { encoding: "utf8" });
    } catch (err) {
      console.warn(chalk.yellow(`⚠️ Impossible de lire le contenu de ${file}`));
      continue;
    }

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        console.error(chalk.red(`🚨 Secret détecté dans ${file}`));
        console.error(chalk.red(`🔍 Pattern suspect: ${pattern}`));
        secretDetected = true;
      }
    }
  }

  if (secretDetected) {
    console.error(
      chalk.red("\n❌ Secrets potentiels détectés. Commit bloqué.")
    );
    return false;
  }

  console.log(chalk.green("✅ Aucun secret détecté dans les fichiers staged."));
  return true;
};
export { scanForSecrets };
