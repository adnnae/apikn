require('dotenv').config();
const { pool } = require('./db');

async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure des tables...\n');
    
    // Vérifier si les tables existent
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME LIKE '%reglement%'
    `, [process.env.DB_NAME || 'default_db']);
    
    console.log('📋 Tables trouvées:');
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    console.log('');
    
    // Vérifier la structure de historique_reglements_clients
    if (tables.some(t => t.TABLE_NAME === 'historique_reglements_clients')) {
      console.log('🔍 Structure de historique_reglements_clients:');
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'historique_reglements_clients'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'default_db']);
      
      console.table(columns);
      
      // Vérifier si la colonne 'action' existe
      const hasAction = columns.some(c => c.COLUMN_NAME === 'action');
      const hasTypeModification = columns.some(c => c.COLUMN_NAME === 'typeModification');
      
      console.log('\n📊 Analyse:');
      console.log(`   - Colonne 'action': ${hasAction ? '✅ Existe' : '❌ Manquante'}`);
      console.log(`   - Colonne 'typeModification': ${hasTypeModification ? '✅ Existe' : '❌ Manquante'}`);
      
      if (hasTypeModification && !hasAction) {
        console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
        console.log('   La table utilise "typeModification" mais le code utilise "action"');
        console.log('   Solution: Renommer la colonne ou modifier le code');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkTableStructure();
