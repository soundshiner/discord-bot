// tools/projectContext.js

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const outputMarkdown = args.includes('--md') || args.includes('--markdown');

const IGNORED = [
  'node_modules',
  '.git',
  'logs',
  'coverage',
  '.vscode',
  'suggestions.sqlite',
  'z_contexte.txt'
];

// ==== Configuration projet ====
const config = {
  projectName: 'soundshine-bot',
  description: 'Bot Discord modulaire pour webradio communautaire.',
  criticalFiles: [
    'index.js',
    'core/services/AppState.js',
    'core/utils/retry.js',
    'core/utils/secureLogger.js',
    'bot/events/interactionCreate.js',
    'core/utils/rateLimiter.js',
    'core/handlers/commandHandler.js'
  ],
  envFiles: ['.env', '.env.dev', '.env.prod'],
  stack: {
    runtime: 'Node.js',
    framework: 'discord.js v14.21.0',
    database: 'better-sqlite3',
    logger: 'logger.js + secureLogger.js',
    validation: 'zod',
    tests: ['vitest', 'stress-test maison'],
    devops: ['docker', 'CI/CD', 'husky', 'eslint']
  }
};

// ==== Arborescence du projet ====
function getTree(dir, depth = 0) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((f) => !IGNORED.includes(f.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return entries.flatMap((entry) => {
    const prefix = '  '.repeat(depth);
    const name = entry.isDirectory() ? `[${entry.name}]` : entry.name;
    const fullPath = path.join(dir, entry.name);
    const line = `${prefix}${name}`;
    return entry.isDirectory()
      ? [line, ...getTree(fullPath, depth + 1)]
      : [line];
  });
}

// ==== Markdown Renderer ====
function generateMarkdown(context) {
  return `# 📦 ${context.projectName}

> ${context.description}

---

## 🧠 Stack

- **Runtime:** ${context.stack.runtime}
- **Framework:** ${context.stack.framework}
- **DB:** ${context.stack.database}
- **Logger:** ${context.stack.logger}
- **Validation:** ${context.stack.validation}
- **Tests:** ${context.stack.tests.join(', ')}
- **DevOps:** ${context.stack.devops.join(', ')}

---

## 🗂️ Fichiers critiques

${context.criticalFiles.map(f => `- \`${f}\``).join('\n')}

---

## ⚙️ Architecture

- **Modèle:** ${context.architecture.style}
- **Entrée:** \`${context.architecture.entryPoint}\`
- **Handlers:** ${context.architecture.handlers.join(', ')}
- **API:** ${context.architecture.api.type}
- **Routes:** ${context.architecture.api.routes.join(', ')}
- **AppState:** \`${context.architecture.appState}\`

---

## 🌱 Variables d’environnement

- ${context.env.envFiles.map(e => `\`${e}\``).join(', ')}
- **Actuellement :** \`${context.env.currentEnv}\`

---

## 🧾 Arborescence (excluant: ${IGNORED.join(', ')})

\`\`\`
${context.projectTree}
\`\`\`
`;
}

// ==== Générer le contexte ====
function generateContext() {
  const treeOutput = getTree(projectRoot).join('\n');
  const context = {
    ...config,
    architecture: {
      style: 'modulaire',
      entryPoint: 'index.js',
      handlers: ['commands', 'events', 'tasks', 'services', 'api'],
      api: {
        type: 'Express.js',
        routes: ['REST', 'secured middleware']
      },
      appState: 'core/services/AppState.js'
    },
    env: {
      envFiles: config.envFiles,
      currentEnv: process.env.NODE_ENV || 'undefined'
    },
    projectTree: treeOutput
  };

  const jsonPath = path.join(projectRoot, 'chatgpt-project-context.json');
  fs.writeFileSync(jsonPath, JSON.stringify(context, null, 2));

  if (outputMarkdown) {
    const markdownPath = path.join(projectRoot, 'chatgpt-project-context.md');
    fs.writeFileSync(markdownPath, generateMarkdown(context));
    console.log('📘 Export Markdown : chatgpt-project-context.md');
  }

  console.log('✅ Export JSON : chatgpt-project-context.json');
}

generateContext();
