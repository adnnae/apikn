// Script de test pour vérifier le clonage d'utilisateur
require('dotenv').config();
const { pool } = require('./db');

async function testCloneUser() {
  try {
    console.log('🔍 Vérification des colonnes de la table users...');
    
    // 1. Vérifier les colonnes existantes
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Colonnes existantes dans la table users:');
    columns.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));
    
    // 2. Récupérer un utilisateur existant
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('\n❌ Aucun utilisateur trouvé dans la base de données');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('\n✅ Utilisateur trouvé:', user.username);
    console.log('📋 Colonnes avec valeur:');
    Object.keys(user).forEach(key => {
      if (user[key] !== null) {
        console.log(`  - ${key}: ${typeof user[key] === 'string' && user[key].length > 50 ? user[key].substring(0, 50) + '...' : user[key]}`);
      }
    });
    
    // 3. Tester le clonage
    console.log('\n🧪 Test de clonage...');
    const testUsername = 'test_clone_' + Date.now();
    
    try {
      const [result] = await pool.query(
        `INSERT INTO users (
          username, password, email, nom, prenom, telephone, adresse, role, isActive,
          nomSociete, raisonSociale, telephone2, fixe, fax, ville, adresseComplete,
          ice, rc, if_, cnss, banque, codeBanque, compteBanque, activite, texte,
          logoBase64, signatureCachetBase64, devise, langue, configurationTerminee,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          NOW(), NOW())`,
        [
          testUsername,
          'test123',
          user.email || null,
          user.nom || null,
          user.prenom || null,
          user.telephone || null,
          user.adresse || null,
          'vendeur',
          1,
          user.nomSociete || null,
          user.raisonSociale || null,
          user.telephone2 || null,
          user.fixe || null,
          user.fax || null,
          user.ville || null,
          user.adresseComplete || null,
          user.ice || null,
          user.rc || null,
          user.if_ || null,
          user.cnss || null,
          user.banque || null,
          user.codeBanque || null,
          user.compteBanque || null,
          user.activite || null,
          user.texte || null,
          user.logoBase64 || null,
          user.signatureCachetBase64 || null,
          user.devise || 'EUR',
          user.langue || 'fr',
          user.configurationTerminee || 0
        ]
      );
      
      console.log(`✅ Clonage réussi! Nouvel utilisateur ID: ${result.insertId}`);
      
      // Supprimer l'utilisateur de test
      await pool.query('DELETE FROM users WHERE id = ?', [result.insertId]);
      console.log('🗑️ Utilisateur de test supprimé');
      
    } catch (error) {
      console.error('\n❌ Erreur lors du clonage:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('SQL:', error.sql);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

testCloneUser();
