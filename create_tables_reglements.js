require('dotenv').config();
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function createTablesReglements() {
  try {
    console.log('🔧 Création des tables pour les règlements clients et fournisseurs...');
    
    const sqlFile = path.join(__dirname, 'sql', 'create_tables_reglements.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Séparer les requêtes SQL
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    for (const query of queries) {
      try {
        await pool.query(query);
        console.log('✅ Requête exécutée avec succès');
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Table existe déjà, ignoré');
        } else {
          console.error('❌ Erreur:', err.message);
        }
      }
    }
    
    console.log('✅ Tables des règlements créées avec succès!');
    
    // Vérifier les tables créées
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME LIKE '%reglement%'
    `, [process.env.DB_NAME]);
    
    console.log('\n📋 Tables créées:');
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    process.exit(1);
  }
}

createTablesReglements();
