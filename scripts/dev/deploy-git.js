import { execSync } from "child_process";
import inquirer from "inquirer";
import { Octokit } from "octokit";

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
          validate: (v) => v.length > 0 || "Un titre est requis",
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
      execSync(`git add .`, { stdio: "inherit" });
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
      const { prTitle, prBody } = await inquirer.prompt([
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
      ]);

      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        console.error(
          "❌ Il faut définir la variable d'environnement GITHUB_TOKEN pour créer une PR."
        );
        process.exit(1);
      }

      const octokit = new Octokit({ auth: token });

      // Récup owner/repo
      const remoteUrl = execSync("git config --get remote.origin.url")
        .toString()
        .trim();
      // Exemple format: git@github.com:owner/repo.git
      const repoMatch = remoteUrl.match(/[:/]([^/]+)\/(.+)\.git$/);
      if (!repoMatch) {
        console.error(
          "❌ Impossible de détecter owner/repo depuis l'URL remote origin."
        );
        process.exit(1);
      }
      const owner = repoMatch[1];
      const repo = repoMatch[2];

      console.log(
        `📦 Création PR ${currentBranch} -> ${baseBranch} sur ${owner}/${repo}...`
      );
      const { data: pr } = await octokit.rest.pulls.create({
        owner,
        repo,
        title: prTitle,
        head: currentBranch,
        base: baseBranch,
        body: prBody || "",
      });

      console.log(`✅ PR créée: ${pr.html_url}`);
    }
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

run();

