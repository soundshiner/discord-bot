#!/usr/bin/env node

// ========================================
// Script de correction des ephemeral dépréciés
// ========================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossiers à traiter
const directories = ['../commands', '../events', '../handlers'];

// Fonction pour traiter un fichier
function processFile (filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Vérifier si le fichier contient ephemeral: true
    if (content.includes('ephemeral: true')) {
      console.log(`🔧 Traitement de: ${filePath}`);

      // Ajouter l'import MessageFlags si pas présent
      if (!content.includes('MessageFlags')) {
        const importMatch = content.match(/import\s+{[^}]*}\s+from\s+['"]discord\.js['"]/);
        if (importMatch) {
          // Ajouter MessageFlags à l'import existant
          content = content.replace(importMatch[0], importMatch[0].replace('}', ', MessageFlags }'));
        } else {
          // Ajouter un nouvel import
          content = `import { MessageFlags } from 'discord.js';\n${content}`;
        }
        modified = true;
      }

      // Remplacer ephemeral: true par flags: MessageFlags.Ephemeral
      content = content.replace(/ephemeral:\s*true/g, 'flags: MessageFlags.Ephemeral');
      modified = true;

      // Écrire le fichier modifié
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Modifié: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error.message);
  }
}

// Fonction pour traiter un répertoire
function processDirectory (dirPath) {
  try {
    const fullPath = path.join(__dirname, dirPath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Dossier non trouvé: ${fullPath}`);
      return;
    }

    const files = fs.readdirSync(fullPath);

    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(fullPath, file);
        processFile(filePath);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement du dossier ${dirPath}:`, error.message);
  }
}

// Fonction principale
function main () {
  console.log('🚀 Début de la correction des ephemeral dépréciés...\n');

  for (const dir of directories) {
    console.log(`📁 Traitement du dossier: ${dir}`);
    processDirectory(dir);
    console.log('');
  }

  console.log('✅ Correction terminée !');
  console.log('\n📝 N\'oubliez pas de :');
  console.log('1. Vérifier que les imports sont corrects');
  console.log('2. Tester les commandes modifiées');
  console.log('3. Lancer npm run lint pour vérifier la syntaxe');
}

// Exécuter le script
main();
