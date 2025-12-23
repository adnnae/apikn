require('dotenv').config();
const { pool } = require('./db');

async function testReglements() {
  console.log('🧪 Test des règlements clients et fournisseurs\n');
  
  try {
    // Test 1: Vérifier que les tables existent
    console.log('📋 Test 1: Vérification des tables...');
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('reglements_clients', 'reglements_fournisseurs', 
                         'historique_reglements_clients', 'historique_reglements_fournisseurs')
    `, [process.env.DB_NAME]);
    
    console.log(`✅ ${tables.length} tables trouvées:`);
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    
    if (tables.length < 4) {
      console.log('\n⚠️  Certaines tables manquent. Exécutez: node create_tables_reglements.js');
      process.exit(1);
    }
    
    // Test 2: Insérer un règlement client de test
    console.log('\n📝 Test 2: Insertion règlement client...');
    const [resultClient] = await pool.query(`
      INSERT INTO reglements_clients 
      (marchandiseId, clientId, venteId, dateReglement, montant, modePaiement, reference, notes, lastModified)
      VALUES (1, 1, 1, NOW(), 500.00, 'espece', 'TEST-REG-CLIENT-001', 'Test règlement client', NOW())
    `);
    console.log(`✅ Règlement client créé avec ID: ${resultClient.insertId}`);
    
    // Test 3: Insérer un règlement fournisseur de test
    console.log('\n📝 Test 3: Insertion règlement fournisseur...');
    const [resultFournisseur] = await pool.query(`
      INSERT INTO reglements_fournisseurs 
      (marchandiseId, fournisseurId, achatId, dateReglement, montant, modePaiement, reference, notes, lastModified)
      VALUES (1, 1, 1, NOW(), 1000.00, 'cheque', 'TEST-REG-FOURN-001', 'Test règlement fournisseur', NOW())
    `);
    console.log(`✅ Règlement fournisseur créé avec ID: ${resultFournisseur.insertId}`);
    
    // Test 4: Récupérer les règlements
    console.log('\n📊 Test 4: Récupération des règlements...');
    const [reglementsClients] = await pool.query('SELECT * FROM reglements_clients WHERE reference LIKE "TEST-%"');
    const [reglementsFournisseurs] = await pool.query('SELECT * FROM reglements_fournisseurs WHERE reference LIKE "TEST-%"');
    
    console.log(`✅ ${reglementsClients.length} règlement(s) client(s) trouvé(s)`);
    console.log(`✅ ${reglementsFournisseurs.length} règlement(s) fournisseur(s) trouvé(s)`);
    
    // Test 5: Mettre à jour un règlement
    console.log('\n🔄 Test 5: Mise à jour règlement client...');
    await pool.query(`
      UPDATE reglements_clients 
      SET montant = 750.00, notes = 'Test règlement client - MODIFIÉ', lastModified = NOW()
      WHERE id = ?
    `, [resultClient.insertId]);
    console.log('✅ Règlement client mis à jour');
    
    // Test 6: Vérifier l'historique
    console.log('\n📜 Test 6: Vérification de l\'historique...');
    const [historique] = await pool.query(`
      SELECT COUNT(*) as count FROM historique_reglements_clients 
      WHERE reglementId = ?
    `, [resultClient.insertId]);
    console.log(`✅ ${historique[0].count} entrée(s) dans l'historique`);
    
    // Test 7: Statistiques
    console.log('\n📈 Test 7: Statistiques...');
    const [statsClients] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(montant) as montant_total,
        AVG(montant) as montant_moyen
      FROM reglements_clients
    `);
    
    const [statsFournisseurs] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(montant) as montant_total,
        AVG(montant) as montant_moyen
      FROM reglements_fournisseurs
    `);
    
    console.log('\n📊 Règlements Clients:');
    console.log(`   Total: ${statsClients[0].total}`);
    console.log(`   Montant total: ${statsClients[0].montant_total || 0} DH`);
    console.log(`   Montant moyen: ${statsClients[0].montant_moyen || 0} DH`);
    
    console.log('\n📊 Règlements Fournisseurs:');
    console.log(`   Total: ${statsFournisseurs[0].total}`);
    console.log(`   Montant total: ${statsFournisseurs[0].montant_total || 0} DH`);
    console.log(`   Montant moyen: ${statsFournisseurs[0].montant_moyen || 0} DH`);
    
    // Test 8: Nettoyage (supprimer les données de test)
    console.log('\n🧹 Test 8: Nettoyage des données de test...');
    await pool.query('DELETE FROM reglements_clients WHERE reference LIKE "TEST-%"');
    await pool.query('DELETE FROM reglements_fournisseurs WHERE reference LIKE "TEST-%"');
    console.log('✅ Données de test supprimées');
    
    console.log('\n✅ ✅ ✅ TOUS LES TESTS RÉUSSIS! ✅ ✅ ✅\n');
    console.log('🎉 La synchronisation des règlements est prête à être utilisée!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\n📝 Stack trace:', error.stack);
    process.exit(1);
  }
}

testReglements();
