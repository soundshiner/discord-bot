// ========================================
// scripts/diagnostic.js - Script de diagnostic pour déboguer le bot
// ========================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('🔍 DIAGNOSTIC DU BOT SOUNDSHINE\n');
console.log('='.repeat(50));

// 1. Vérifier la structure des dossiers
console.log('\n📁 STRUCTURE DES DOSSIERS :');
const expectedDirs = [
  'bot',
  'bot/commands',
  'bot/events',
  'bot/handlers',
  'core',
  'utils'
];

expectedDirs.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}`);
});

// 2. Scanner les fichiers de commandes
console.log('\n🎮 COMMANDES DÉTECTÉES :');
const commandsDir = path.join(rootDir, 'bot/commands');

function scanCommands(dir, prefix = '') {
  if (!fs.existsSync(dir)) {
    console.log('   ❌ Dossier commands introuvable');
    return [];
  }

  const commands = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const displayName = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      console.log(`   📂 ${displayName}/`);
      const subCommands = scanCommands(fullPath, displayName);
      commands.push(...subCommands);
    } else if (entry.name.endsWith('.js')) {
      console.log(`   📄 ${displayName}`);
      commands.push({ name: entry.name, path: fullPath, category: prefix || 'general' });
    }
  }

  return commands;
}

const detectedCommands = scanCommands(commandsDir);

// 3. Tester le chargement des commandes
console.log('\n🔧 TEST DE CHARGEMENT DES COMMANDES :');
for (const cmd of detectedCommands) {
  try {
    const fileUrl = pathToFileURL(cmd.path).href;
    const module = await import(fileUrl);
    
    const isValid = module.default && 
                   module.default.data && 
                   module.default.data.name && 
                   typeof module.default.execute === 'function';
    
    if (isValid) {
      console.log(`   ✅ ${cmd.name} (${module.default.data.name})`);
    } else {
      console.log(`   ❌ ${cmd.name} - Structure invalide`);
      if (!module.default) console.log(`      - Pas d'export default`);
      if (!module.default?.data) console.log(`      - Pas de propriété data`);
      if (!module.default?.data?.name) console.log(`      - Pas de data.name`);
      if (typeof module.default?.execute !== 'function') console.log(`      - execute n'est pas une fonction`);
    }
  } catch (error) {
    console.log(`   ❌ ${cmd.name} - Erreur: ${error.message}`);
  }
}

// 4. Vérifier la configuration
console.log('\n⚙️  CONFIGURATION :');
try {
  const configPath = path.join(rootDir, 'bot/config.js');
  if (fs.existsSync(configPath)) {
    const config = await import(pathToFileURL(configPath).href);
    console.log('   ✅ Fichier config.js trouvé');
    
    // Vérifier les variables importantes
    const requiredVars = ['DISCORD_TOKEN', 'ADMIN_ROLE_ID'];
    const optionalVars = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'];
    
    console.log('\n   Variables requises :');
    requiredVars.forEach(varName => {
      const hasVar = !!(config.default[varName]);
      console.log(`     ${hasVar ? '✅' : '❌'} ${varName}`);
    });
    
    console.log('\n   Variables optionnelles :');
    optionalVars.forEach(varName => {
      const hasVar = !!(config.default[varName]);
      console.log(`     ${hasVar ? '✅' : '⚠️ '} ${varName}`);
    });
    
  } else {
    console.log('   ❌ Fichier config.js introuvable');
  }
} catch (error) {
  console.log(`   ❌ Erreur lors du chargement de la config: ${error.message}`);
}

// 5. Vérifier les fichiers .env
console.log('\n🔐 FICHIERS ENVIRONNEMENT :');
const envFiles = ['.env', '.env.dev', '.env.prod'];
envFiles.forEach(envFile => {
  const envPath = path.join(rootDir, envFile);
  const exists = fs.existsSync(envPath);
  console.log(`   ${exists ? '✅' : '⚠️ '} ${envFile}`);
});

// 6. Vérifier les handlers
console.log('\n🔄 HANDLERS :');
const handlerFiles = [
  'bot/events/interactionCreate.js',
  'bot/events/handlers/InteractionHandler.js',
  'bot/events/handlers/ValidationHandler.js',
  'bot/handlers/loadCommands.js'
];

handlerFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 7. Vérifier AppState
console.log('\n🏗️  APPSTATE :');
try {
  const appStatePath = path.join(rootDir, 'core/services/AppState.js');
  if (fs.existsSync(appStatePath)) {
    const AppState = await import(pathToFileURL(appStatePath).href);
    console.log('   ✅ AppState importé avec succès');
    
    // Tester quelques méthodes
    const state = AppState.default;
    console.log(`   📊 Bot ready: ${state.bot?.ready || false}`);
    console.log(`   📊 DB connected: ${state.db?.connected || false}`);
  } else {
    console.log('   ❌ AppState.js introuvable');
  }
} catch (error) {
  console.log(`   ❌ Erreur AppState: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 DIAGNOSTIC TERMINÉ');
console.log('\nPour résoudre les problèmes :');
console.log('1. Créez les fichiers manquants (❌)');
console.log('2. Configurez les variables d\'environnement manquantes');
console.log('3. Vérifiez la structure des commandes');
console.log('4. Relancez le bot après corrections');
console.log('\n💡 Consultez les artifacts créés pour les solutions !');