// ========================================
// scripts/test-airtable.js - Script de test pour Airtable
// ========================================

import Airtable from 'airtable';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

console.log('🔍 TEST DE CONFIGURATION AIRTABLE\n');
console.log('='.repeat(50));

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement :');
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log(`   API Key: ${apiKey ? '✅ Définie (' + apiKey.substring(0, 10) + '...)' : '❌ Manquante'}`);
console.log(`   Base ID: ${baseId ? '✅ Définie (' + baseId + ')' : '❌ Manquante'}`);

if (!apiKey || !baseId) {
  console.log('\n❌ Configuration incomplète. Ajoutez dans votre .env :');
  console.log('AIRTABLE_API_KEY=votre_api_key');
  console.log('AIRTABLE_BASE_ID=votre_base_id');
  process.exit(1);
}

// 2. Tester la connexion Airtable
console.log('\n🔌 Test de connexion Airtable :');
let base;

try {
  base = new Airtable({ apiKey }).base(baseId);
  console.log('   ✅ Instance Airtable créée');
} catch (error) {
  console.log(`   ❌ Erreur création instance: ${error.message}`);
  process.exit(1);
}

// 3. Tester l'accès à la base
console.log('\n📚 Test d\'accès à la base :');
try {
  // Essayer de lister les tables (cette opération nécessite des permissions de lecture)
  const tables = await base('Backlog').select({ maxRecords: 1 }).firstPage();
  console.log('   ✅ Accès à la table "Backlog" réussi');
  console.log(`   📊 Nombre d'enregistrements testés: ${tables.length}`);
} catch (error) {
  console.log(`   ❌ Erreur d'accès à la table: ${error.message}`);
  
  if (error.message.includes('not authorized')) {
    console.log('\n💡 SOLUTION: Problème d\'autorisation');
    console.log('   1. Vérifiez que votre API Key est correcte');
    console.log('   2. Utilisez un Personal Access Token récent');
    console.log('   3. Vérifiez les permissions sur la base');
  } else if (error.message.includes('not found')) {
    console.log('\n💡 SOLUTION: Table introuvable');
    console.log('   1. Créez une table nommée "Backlog"');
    console.log('   2. Vérifiez l\'orthographe exacte');
  }
  
  // Ne pas quitter, continuer les tests
}

// 4. Tester la création d'un enregistrement
console.log('\n📝 Test de création d\'enregistrement :');
try {
  const testRecord = await base('Backlog').create([{
    fields: {
      'Idée': '🧪 Test depuis le script de diagnostic',
      'Utilisateur': 'test-bot'
    }
  }]);
  
  const recordId = testRecord[0].id;
  console.log('   ✅ Création réussie !');
  console.log(`   🆔 Record ID: ${recordId}`);
  
  // 5. Tester la suppression (nettoyage)
  console.log('\n🗑️  Nettoyage du test :');
  try {
    await base('Backlog').destroy([recordId]);
    console.log('   ✅ Enregistrement de test supprimé');
  } catch (deleteError) {
    console.log(`   ⚠️  Impossible de supprimer: ${deleteError.message}`);
    console.log(`   🔗 Supprimez manuellement le record ${recordId}`);
  }
  
} catch (error) {
  console.log(`   ❌ Erreur de création: ${error.message}`);
  
  if (error.message.includes('field')) {
    console.log('\n💡 SOLUTION: Champs manquants');
    console.log('   Créez ces champs dans votre table "Backlog" :');
    console.log('   • "Idée" (Long text) - REQUIS');
    console.log('   • "Utilisateur" (Single line text) - REQUIS');
    console.log('   • "User ID" (Single line text) - OPTIONNEL');
    console.log('   • "Date" (Date) - OPTIONNEL');
    console.log('   • "Statut" (Single select) - OPTIONNEL');
  }
}

// 6. Test de l'URL de la base
console.log('\n🔗 URL de votre base :');
const baseUrl = `https://airtable.com/${baseId}`;
console.log(`   ${baseUrl}`);

console.log('\n' + '='.repeat(50));
console.log('🏁 TEST TERMINÉ');

console.log('\n💡 Prochaines étapes :');
console.log('1. Corrigez les erreurs identifiées ci-dessus');
console.log('2. Relancez ce script pour vérifier');
console.log('3. Testez la commande /backlog dans Discord');

// 7. Informations supplémentaires
console.log('\n📚 Liens utiles :');
console.log('• Personal Access Tokens: https://airtable.com/create/tokens');
console.log('• Documentation API: https://airtable.com/developers/web/api/introduction');
console.log('• Support: https://support.airtable.com/');