// Script pour ajouter la colonne userId aux tables lignes_retour
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addUserIdColumn() {
  let connection;
  
  try {
    console.log('🔄 Connexion à MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connecté à MySQL\n');

    // Ajouter userId à lignes_retour_vente
    console.log('📝 Ajout de la colonne userId à lignes_retour_vente...');
    try {
      await connection.query(`
        ALTER TABLE lignes_retour_vente 
        ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id
      `);
      console.log('✅ Colonne userId ajoutée à lignes_retour_vente\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne userId existe déjà dans lignes_retour_vente\n');
      } else {
        throw e;
      }
    }

    // Ajouter userId à lignes_retour_achat
    console.log('📝 Ajout de la colonne userId à lignes_retour_achat...');
    try {
      await connection.query(`
        ALTER TABLE lignes_retour_achat 
        ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id
      `);
      console.log('✅ Colonne userId ajoutée à lignes_retour_achat\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Colonne userId existe déjà dans lignes_retour_achat\n');
      } else {
        throw e;
      }
    }

    console.log('🎉 Correction terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion MySQL fermée');
    }
  }
}

addUserIdColumn();
