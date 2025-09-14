import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const outputMarkdown = args.includes('--md') || args.includes('--markdown');
const includeFull = args.includes('--full');

const IGNORED = [
  'node_modules', '.git', 'logs', 'coverage', '.vscode',
  'suggestions.sqlite', 'z_contexte.txt'
];

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
    devops: ['docker', 'CI/CD', 'eslint']
  }
};

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

function getStats(root) {
  let totalSize = 0;
  let fileCount = 0;
  let jsCount = 0;
  let tsCount = 0;

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        const size = fs.statSync(fullPath).size;
        totalSize += size;
        fileCount++;
        if (fullPath.endsWith('.js')) jsCount++;
        if (fullPath.endsWith('.ts')) tsCount++;
      }
    }
  }

  scan(root);
  return {
    fileCount,
    totalSizeKb: (totalSize / 1024).toFixed(2),
    avgSizeKb: (totalSize / fileCount / 1024).toFixed(2),
    jsCount,
    tsCount
  };
}

function readIfExists(file) {
  const p = path.join(projectRoot, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

function findConfigFiles(fileNames) {
  const found = [];
  for (const fileName of fileNames) {
    const pathsToTry = [
      fileName,
      path.join('config', fileName),
      path.join('docker', fileName)
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(path.join(projectRoot, p))) {
        found.push(p);
        break;
      }
    }
  }
  return found;
}

function generateContext() {
  const treeOutput = getTree(projectRoot).join('\n');
  const stats = getStats(projectRoot);

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
    projectTree: treeOutput,
    stats,
    dependencies: {},
    scripts: {},
    configFiles: {}
  };

  const pkg = readIfExists('package.json');
  if (pkg) {
    const parsed = JSON.parse(pkg);
    context.dependencies = parsed.dependencies || {};
    context.devDependencies = parsed.devDependencies || {};
    context.scripts = parsed.scripts || {};
  }

  const fileNames = [
    'docker-compose.yml',
    'tsconfig.json',
    'vite.config.js',
    '.eslintrc.js',
    '.prettierrc',
    'prometheus.yml'
  ];
  const configFiles = findConfigFiles(fileNames);

  configFiles.forEach(file => {
    const content = readIfExists(file);
    if (content && includeFull) context.configFiles[file] = content;
    else if (content) context.configFiles[file] = '[present]';
  });

  const jsonPath = path.join(projectRoot, 'chatgpt-project-context.json');
  fs.writeFileSync(jsonPath, JSON.stringify(context, null, 2));
  console.log('✅ Export JSON : chatgpt-project-context.json');

  if (outputMarkdown) {
    const markdownPath = path.join(projectRoot, 'chatgpt-project-context.md');
    fs.writeFileSync(markdownPath, generateMarkdown(context));
    console.log('📘 Export Markdown : chatgpt-project-context.md');
  }
}

function generateMarkdown(context) {
  return `# 📦 ${context.projectName}

> ${context.description}

## 🧠 Stack
${Object.entries(context.stack).map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

## 🧾 Arborescence
\`\`\`
${context.projectTree}
\`\`\`

## 📊 Stats
- Fichiers : ${context.stats.fileCount}
- JS : ${context.stats.jsCount}, TS : ${context.stats.tsCount}
- Taille totale : ${context.stats.totalSizeKb} Ko
- Taille moyenne/fichier : ${context.stats.avgSizeKb} Ko
`;
}

generateContext();
