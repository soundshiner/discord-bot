import { execSync } from "child_process";
import inquirer from "inquirer";
import { Octokit } from "octokit";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    // 1. Choix commit et/ou PR
    const { doPR, doCommit } = await inquirer.prompt([
      {
        type: "confirm",
        name: "doCommit",
        message: "Veux-tu faire un commit ?",
        default: true,
      },
      {
        type: "confirm",
        name: "doPR",
        message: "Veux-tu créer une Pull Request ?",
        default: false,
        when: (answers) => answers.doCommit,
      },
    ]);

    if (!doCommit && !doPR) {
      console.log("Rien à faire, bye.");
      return;
    }

    // 2. Récupérer message commit
    let commitTitle = "";
    let commitDesc = "";
    if (doCommit) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "title",
          message: "Titre du commit :",
          validate: (v) => {
            if (v.length < 10) return "Titre trop court (min 10 chars)";
            if (v.length > 72) return "Titre trop long (max 72 chars)";
            return true;
          },
        },
        {
          type: "input",
          name: "desc",
          message: "Description du commit (optionnel) :",
        },
      ]);
      commitTitle = answers.title;
      commitDesc = answers.desc;
    }

    // 3. Commit
    if (doCommit) {
      execSync("git add .", { stdio: "inherit" });
      const commitMsg = commitDesc
        ? `${commitTitle}\n\n${commitDesc}`
        : commitTitle;
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, {
        stdio: "inherit",
      });
      console.log("✅ Commit fait.");
    }

    // 4. Detect branch
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
    const baseBranch = currentBranch.startsWith("hotfix/") ? "main" : "develop";
    console.log(
      `🌿 Branche courante: ${currentBranch}, base pour rebase: ${baseBranch}`
    );

    // 5. Rebase
    console.log(`🔁 Mise à jour de ta branche via rebase sur ${baseBranch}...`);
    execSync(`git fetch origin ${baseBranch}`, { stdio: "inherit" });
    try {
      execSync(`git rebase origin/${baseBranch}`, { stdio: "inherit" });
      console.log("✅ Rebase OK.");
    } catch (err) {
      console.error(
        "❌ Conflit pendant le rebase. Résous-le manuellement et relance le script."
      );
      process.exit(1);
    }

    // 6. Push
    console.log(`⬆️ Push sur ${currentBranch}...`);
    execSync(`git push origin ${currentBranch}`, { stdio: "inherit" });
    console.log("✅ Push OK.");

    // 7. Créer la PR si demandé
    if (doPR) {
      const { prTitle, prBody, autoDeploy } = await inquirer.prompt([
        {
          type: "input",
          name: "prTitle",
          message: "Titre de la PR :",
          default: commitTitle,
        },
        {
          type: "input",
          name: "prBody",
          message: "Description de la PR (optionnel) :",
        },
        {
          type: "confirm",
          name: "autoDeploy",
          message: "Activer le déploiement automatique si les tests passent ?",
          default: true,
        },
      ]);

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        console.error(
          "❌ Il faut définir la variable d'environnement GITHUB_TOKEN pour créer une PR."
        );
        process.exit(1);
      }

      const octokit = new Octokit({ auth: token });

      // Récupération de l'URL remote
      const remoteUrl = execSync("git config --get remote.origin.url")
        .toString()
        .trim();
      console.log("remoteUrl:", remoteUrl);

      // Regex plus permissif, accepte .git optionnel
      const repoMatch = remoteUrl.match(/[:/]([^/]+)\/([^/]+)(?:\.git)?$/);

      if (!repoMatch) {
        console.error(
          "❌ Impossible de détecter owner/repo depuis l'URL remote origin."
        );
        process.exit(1);
      }

      const owner = repoMatch[1];
      const repo = repoMatch[2];

      console.log(`Parsed owner: ${owner}, repo: ${repo}`);

      // Vérification branche source différente de branche cible
      if (currentBranch === baseBranch) {
        console.error(
          "❌ La branche source et la branche cible sont identiques. Impossible de créer une PR."
        );
        process.exit(1);
      }

      console.log(
        `📦 Création PR ${currentBranch} -> ${baseBranch} sur ${owner}/${repo}...`
      );

      // Template de PR automatique
      const defaultPrBody =
        prBody ||
        `## Description
${commitDesc || "Amélioration du code"}

## Tests
- [ ] Tests unitaires passent
- [ ] Linting OK
- [ ] Fonctionnalité testée

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Refactoring
- [ ] Documentation

## Déploiement
${
  autoDeploy
    ? "✅ Déploiement automatique activé"
    : "❌ Déploiement manuel requis"
}

---
*PR créée automatiquement via deploy-git.js*`;

      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: prTitle,
        head: currentBranch,
        base: baseBranch,
        body: defaultPrBody,
      });

      console.log(`✅ PR créée: ${pr.html_url}`);

      if (autoDeploy) {
        console.log(
          "🚀 Déploiement automatique activé - Le code sera déployé automatiquement si les tests passent !"
        );
      }
    }
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

run();

