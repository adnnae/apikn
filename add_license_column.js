// ============================================================================
// Script pour ajouter la colonne 'license' à la table Users
// ============================================================================
require('dotenv').config();
const { pool } = require('./db');

async function addLicenseColumn() {
  console.log('🔧 Ajout de la colonne "license" à la table Users...\n');
  
  try {
    // Vérifier si la colonne existe déjà
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'license'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      console.log('✅ La colonne "license" existe déjà dans la table Users');
      process.exit(0);
    }
    
    // Ajouter la colonne license
    console.log('📝 Ajout de la colonne "license" (VARCHAR(64))...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN license VARCHAR(64) NULL 
      AFTER role
    `);
    
    console.log('✅ Colonne "license" ajoutée avec succès!');
    console.log('   Type: VARCHAR(64)');
    console.log('   Position: Après la colonne "role"');
    console.log('   Valeur par défaut: NULL');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addLicenseColumn();
