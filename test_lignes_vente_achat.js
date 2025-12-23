// Test rapide pour vérifier les lignes de vente et achat dans MySQL
const { pool } = require('./db');

async function testLignesVenteAchat() {
  try {
    console.log('🔍 Vérification des lignes de vente et achat...\n');

    // Test lignes_vente
    const [lignesVente] = await pool.query('SELECT COUNT(*) as count FROM lignes_vente');
    console.log(`✅ Lignes de vente: ${lignesVente[0].count} enregistrements`);
    
    if (lignesVente[0].count > 0) {
      const [sampleVente] = await pool.query('SELECT * FROM lignes_vente LIMIT 3');
      console.log('   Exemples:');
      sampleVente.forEach(ligne => {
        console.log(`   - Ligne #${ligne.id}: venteId=${ligne.venteId}, produitId=${ligne.produitId}, quantite=${ligne.quantite}`);
      });
    }

    console.log('');

    // Test lignes_achat
    const [lignesAchat] = await pool.query('SELECT COUNT(*) as count FROM lignes_achat');
    console.log(`✅ Lignes d'achat: ${lignesAchat[0].count} enregistrements`);
    
    if (lignesAchat[0].count > 0) {
      const [sampleAchat] = await pool.query('SELECT * FROM lignes_achat LIMIT 3');
      console.log('   Exemples:');
      sampleAchat.forEach(ligne => {
        console.log(`   - Ligne #${ligne.id}: achatId=${ligne.achatId}, produitId=${ligne.produitId}, quantite=${ligne.quantite}`);
      });
    }

    console.log('');

    // Test lignes_retour_vente
    const [lignesRetourVente] = await pool.query('SELECT COUNT(*) as count FROM lignes_retour_vente');
    console.log(`✅ Lignes de retour vente: ${lignesRetourVente[0].count} enregistrements`);
    
    if (lignesRetourVente[0].count > 0) {
      const [sampleRetourVente] = await pool.query('SELECT * FROM lignes_retour_vente LIMIT 3');
      console.log('   Exemples:');
      sampleRetourVente.forEach(ligne => {
        console.log(`   - Ligne #${ligne.id}: retourVenteId=${ligne.retourVenteId}, produitId=${ligne.produitId}, quantite=${ligne.quantite}`);
      });
    }

    console.log('');

    // Test lignes_retour_achat
    const [lignesRetourAchat] = await pool.query('SELECT COUNT(*) as count FROM lignes_retour_achat');
    console.log(`✅ Lignes de retour achat: ${lignesRetourAchat[0].count} enregistrements`);
    
    if (lignesRetourAchat[0].count > 0) {
      const [sampleRetourAchat] = await pool.query('SELECT * FROM lignes_retour_achat LIMIT 3');
      console.log('   Exemples:');
      sampleRetourAchat.forEach(ligne => {
        console.log(`   - Ligne #${ligne.id}: retourAchatId=${ligne.retourAchatId}, produitId=${ligne.produitId}, quantite=${ligne.quantite}`);
      });
    }

    console.log('\n✅ Test terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testLignesVenteAchat();
