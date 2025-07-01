import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BACKUP_BASE = './backups';

// Utilitaire : confirmation utilisateur
function askQuestion (query) {
  const rl = readline.createInterface ({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise (resolve => rl.question (query, ans => {
    rl.close ();
    resolve (ans);
  }));
}

// Liste les dossiers de backup disponibles
function getBackupFolders () {
  return fs.readdirSync (BACKUP_BASE)
    .filter (name => (/^\d{4}-\d{2}-\d{2}$/).test (name))
    .sort ()
    .reverse (); // plus récent en premier
}

// Restaure tous les fichiers depuis un dossier donné
function restoreFromBackup (backupFolder) {
  const backupPath = path.join (BACKUP_BASE, backupFolder);
  if (!fs.existsSync (backupPath)) {
    console.error (`❌ Backup folder not found: ${backupPath}`);
    process.exit (1);
  }

  const files = getAllFiles (backupPath);

  files.forEach (file => {
    const relPath = path.relative (backupPath, file);
    const originalPath = path.join ('./', relPath);

    // S'assurer que le dossier de destination existe
    const destDir = path.dirname (originalPath);
    if (!fs.existsSync (destDir)) {
      fs.mkdirSync (destDir, { recursive: true });
    }

    // Copie
    fs.copyFileSync (file, originalPath);
    console.log (`🔁 Restored: ${originalPath}`);
  });

  console.log ('✅ Restauration complète terminée.');
}

// Récupère tous les fichiers .js dans un dossier récursivement
function getAllFiles (dir) {
  let results = [];

  const list = fs.readdirSync (dir);
  list.forEach (file => {
    const fullPath = path.join (dir, file);
    const stat = fs.statSync (fullPath);

    if (stat && stat.isDirectory ()) {
      results = results.concat (getAllFiles (fullPath));
    } else if (fullPath.endsWith ('.js')) {
      results.push (fullPath);
    }
  });

  return results;
}

async function main () {
  const backups = getBackupFolders ();

  if (backups.length === 0) {
    console.log ('❌ Aucun dossier de backup trouvé.');
    process.exit (1);
  }

  const [backupToRestore] = backups; // dernier backup par défaut
  const confirmation = await askQuestion (
    `⚠️  Confirmer la restauration depuis "${backupToRestore}" ? (oui/non) `
  );

  if (confirmation.toLowerCase () === 'oui') {
    restoreFromBackup (backupToRestore);
  } else {
    console.log ('🛑 Restauration annulée.');
  }
}

main ();
