import fs from 'fs';
import path from 'path';
import parser from '@babel/parser';
import { default as traverse } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

const ROOT_DIR = './';
const BACKUP_BASE = './backups';

const [dateISO] = new Date().toISOString().split('T');
const BACKUP_DIR = path.join (BACKUP_BASE, dateISO);

const IGNORE_DIRS = ['node_modules', 'logs', '.git'];

function shouldIgnoreDir (dirName) {
  return IGNORE_DIRS.includes (dirName) || dirName.startsWith ('.');
}

function ensureDir (dir) {
  if (!fs.existsSync (dir)) {
    fs.mkdirSync (dir, { recursive: true });
  }
}

function relativeBackupPath (filePath) {
  const rel = path.relative (ROOT_DIR, filePath);
  return path.join (BACKUP_DIR, rel);
}

function walkDir (dir) {
  const files = fs.readdirSync (dir);
  for (const file of files) {
    if (shouldIgnoreDir (file)) continue;

    const fullPath = path.join (dir, file);
    const stat = fs.statSync (fullPath);
    if (stat.isDirectory ()) {
      walkDir (fullPath);
    } else if (fullPath.endsWith ('.js')) {
      migrateFile (fullPath);
    }
  }
}

function migrateFile (filePath) {
  const code = fs.readFileSync (filePath, 'utf8');
  const ast = parser.parse (code, {
    sourceType: 'module',
    plugins: ['jsx', 'classProperties']
  });

  let importExists = false;
  let hasModifications = false;

  traverse (ast, {
    Program (path) {
      for (const node of path.node.body) {
        if (
          t.isImportDeclaration (node)
          && node.source.value === './utils/centralizedLogger.js'
        ) {
          importExists = true;
          break;
        }
      }

      if (!importExists) {
        const importDecl = t.importDeclaration (
          [
            t.importSpecifier (t.identifier ('logInfo'), t.identifier ('logInfo')),
            t.importSpecifier (t.identifier ('logWarn'), t.identifier ('logWarn')),
            t.importSpecifier (t.identifier ('logError'), t.identifier ('logError'))
          ],
          t.stringLiteral ('./utils/centralizedLogger.js')
        );
        path.unshiftContainer ('body', importDecl);
        hasModifications = true;
      }
    },

    CallExpression (path) {
      const { callee } = path.node;
      if (
        t.isMemberExpression (callee)
        && t.isIdentifier (callee.object, { name: 'console' })
        && t.isIdentifier (callee.property)
        && ['log', 'warn', 'error'].includes (callee.property.name)
      ) {
        const newFuncName = {
          log: 'logInfo',
          warn: 'logWarn',
          error: 'logError'
        }[callee.property.name];

        path.replaceWith (
          t.callExpression (t.identifier (newFuncName), path.node.arguments)
        );

        hasModifications = true;
      }
    }
  });

  if (hasModifications) {
    const output = generate (ast, {
      retainLines: true,
      concise: false,
      comments: true,
      compact: false,
      jsescOption: { minimal: true }
    });

    // Backup avec structure dans ./backups/YYYY-MM-DD/...
    const backupPath = relativeBackupPath (filePath);
    ensureDir (path.dirname (backupPath));
    fs.copyFileSync (filePath, backupPath);

    fs.writeFileSync (filePath, output.code.replace (/(\w)\(/g, '$1 ('), 'utf8');
    console.log (`✅ Migrated: ${filePath} → Backup: ${backupPath}`);
  } else {
    console.log (`ℹ️  No changes in: ${filePath}`);
  }
}

ensureDir (BACKUP_DIR);
walkDir (ROOT_DIR);
console.log (`🚀 Migration AST terminée. Backups dans ${BACKUP_DIR}`);
