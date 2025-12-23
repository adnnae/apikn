require('dotenv').config();
const { pool } = require('./db');

async function dropAndRecreateReglements() {
  try {
    console.log('🗑️  Suppression des anciennes tables de règlements...\n');
    
    // Supprimer les tables dans le bon ordre (historique d'abord)
    const tablesToDrop = [
      'historique_reglements_fournisseurs',
      'historique_reglements_clients',
      'reglements_fournisseurs',
      'reglements_clients'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Table ${table} supprimée`);
      } catch (err) {
        console.log(`⚠️  Erreur lors de la suppression de ${table}:`, err.message);
      }
    }
    
    console.log('\n🔧 Création des nouvelles tables...\n');
    
    // Créer les tables principales
    await pool.query(`
      CREATE TABLE reglements_clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        marchandiseId INT NOT NULL,
        clientId INT NOT NULL,
        venteId INT,
        dateReglement DATETIME NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        modePaiement VARCHAR(50) DEFAULT 'espece',
        reference VARCHAR(255),
        notes TEXT,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_client (clientId),
        INDEX idx_vente (venteId),
        INDEX idx_date (dateReglement)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Table reglements_clients créée');
    
    await pool.query(`
      CREATE TABLE reglements_fournisseurs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        marchandiseId INT NOT NULL,
        fournisseurId INT NOT NULL,
        achatId INT,
        dateReglement DATETIME NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        modePaiement VARCHAR(50) DEFAULT 'espece',
        reference VARCHAR(255),
        notes TEXT,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_fournisseur (fournisseurId),
        INDEX idx_achat (achatId),
        INDEX idx_date (dateReglement)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Table reglements_fournisseurs créée');
    
    // Créer les tables d'historique
    await pool.query(`
      CREATE TABLE historique_reglements_clients (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reglementId INT NOT NULL,
        marchandiseId INT NOT NULL,
        clientId INT NOT NULL,
        venteId INT,
        dateReglement DATETIME NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        modePaiement VARCHAR(50),
        reference VARCHAR(255),
        notes TEXT,
        action VARCHAR(20) NOT NULL,
        dateAction DATETIME NOT NULL,
        deviceId VARCHAR(100),
        INDEX idx_reglement (reglementId),
        INDEX idx_date_action (dateAction)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Table historique_reglements_clients créée');
    
    await pool.query(`
      CREATE TABLE historique_reglements_fournisseurs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reglementId INT NOT NULL,
        marchandiseId INT NOT NULL,
        fournisseurId INT NOT NULL,
        achatId INT,
        dateReglement DATETIME NOT NULL,
        montant DECIMAL(10,2) NOT NULL,
        modePaiement VARCHAR(50),
        reference VARCHAR(255),
        notes TEXT,
        action VARCHAR(20) NOT NULL,
        dateAction DATETIME NOT NULL,
        deviceId VARCHAR(100),
        INDEX idx_reglement (reglementId),
        INDEX idx_date_action (dateAction)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Table historique_reglements_fournisseurs créée');
    
    console.log('\n📋 Vérification des tables créées:\n');
    
    // Vérifier les tables
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME LIKE '%reglement%'
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'default_db']);
    
    tables.forEach(t => console.log(`   ✅ ${t.TABLE_NAME}`));
    
    // Vérifier la structure de historique_reglements_clients
    console.log('\n🔍 Structure de historique_reglements_clients:\n');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'historique_reglements_clients'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'default_db']);
    
    columns.forEach(c => {
      const nullable = c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   - ${c.COLUMN_NAME.padEnd(20)} ${c.DATA_TYPE.padEnd(15)} ${nullable}`);
    });
    
    // Vérifier que la colonne 'action' existe
    const hasAction = columns.some(c => c.COLUMN_NAME === 'action');
    const hasDateAction = columns.some(c => c.COLUMN_NAME === 'dateAction');
    
    console.log('\n✅ VÉRIFICATION FINALE:');
    console.log(`   - Colonne 'action': ${hasAction ? '✅ OK' : '❌ MANQUANTE'}`);
    console.log(`   - Colonne 'dateAction': ${hasDateAction ? '✅ OK' : '❌ MANQUANTE'}`);
    
    if (hasAction && hasDateAction) {
      console.log('\n🎉 SUCCÈS! Les tables sont correctement créées.');
      console.log('\n📝 PROCHAINES ÉTAPES:');
      console.log('   1. Redémarrer le serveur Node.js (Ctrl+C puis node server.js)');
      console.log('   2. Tester un règlement client dans l\'application');
      console.log('   3. Vérifier que le solde diminue correctement');
    } else {
      console.log('\n❌ ERREUR: Les colonnes action/dateAction sont manquantes!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

dropAndRecreateReglements();
