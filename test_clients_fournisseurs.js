/**
 * Script de test pour vérifier les clients et fournisseurs dans MySQL
 * 
 * Usage:
 *   node test_clients_fournisseurs.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testClientsEtFournisseurs() {
  console.log('🔍 ========================================');
  console.log('🔍 TEST: Clients et Fournisseurs dans MySQL');
  console.log('🔍 ========================================\n');

  let connection;

  try {
    // Connexion à MySQL
    console.log('📡 Connexion à MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '212.192.3.44',
      user: process.env.DB_USER || 'knachsof_admin',
      password: process.env.DB_PASSWORD || 'Knachsoft@2024',
      database: process.env.DB_NAME || 'knachsof_gestion',
      port: process.env.DB_PORT || 3306,
    });
    console.log('✅ Connecté à MySQL\n');

    // ==================== CLIENTS ====================
    console.log('📊 ========== CLIENTS ==========');
    
    // Compter tous les clients
    const [totalClients] = await connection.query('SELECT COUNT(*) as total FROM clients');
    console.log(`📈 Total clients dans la base: ${totalClients[0].total}`);

    // Compter les clients par utilisateur
    const [clientsParUser] = await connection.query(`
      SELECT userId, COUNT(*) as nb_clients 
      FROM clients 
      GROUP BY userId
      ORDER BY userId
    `);
    console.log('\n👥 Clients par utilisateur:');
    clientsParUser.forEach(row => {
      console.log(`   - User ID ${row.userId}: ${row.nb_clients} client(s)`);
    });

    // Afficher les 5 premiers clients
    const [premiers5Clients] = await connection.query(`
      SELECT id, nom, telephone, userId 
      FROM clients 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.log('\n📋 Les 5 derniers clients créés:');
    if (premiers5Clients.length === 0) {
      console.log('   ⚠️ Aucun client trouvé dans la base!');
    } else {
      premiers5Clients.forEach(client => {
        console.log(`   - ID ${client.id}: ${client.nom} (Tel: ${client.telephone || 'N/A'}, User: ${client.userId})`);
      });
    }

    // ==================== FOURNISSEURS ====================
    console.log('\n📊 ========== FOURNISSEURS ==========');
    
    // Compter tous les fournisseurs
    const [totalFournisseurs] = await connection.query('SELECT COUNT(*) as total FROM fournisseurs');
    console.log(`📈 Total fournisseurs dans la base: ${totalFournisseurs[0].total}`);

    // Compter les fournisseurs par utilisateur
    const [fournisseursParUser] = await connection.query(`
      SELECT userId, COUNT(*) as nb_fournisseurs 
      FROM fournisseurs 
      GROUP BY userId
      ORDER BY userId
    `);
    console.log('\n👥 Fournisseurs par utilisateur:');
    fournisseursParUser.forEach(row => {
      console.log(`   - User ID ${row.userId}: ${row.nb_fournisseurs} fournisseur(s)`);
    });

    // Afficher les 5 premiers fournisseurs
    const [premiers5Fournisseurs] = await connection.query(`
      SELECT id, nom, telephone, userId 
      FROM fournisseurs 
      ORDER BY id DESC 
      LIMIT 5
    `);
    console.log('\n📋 Les 5 derniers fournisseurs créés:');
    if (premiers5Fournisseurs.length === 0) {
      console.log('   ⚠️ Aucun fournisseur trouvé dans la base!');
    } else {
      premiers5Fournisseurs.forEach(fournisseur => {
        console.log(`   - ID ${fournisseur.id}: ${fournisseur.nom} (Tel: ${fournisseur.telephone || 'N/A'}, User: ${fournisseur.userId})`);
      });
    }

    // ==================== UTILISATEURS ====================
    console.log('\n📊 ========== UTILISATEURS ==========');
    
    const [users] = await connection.query(`
      SELECT id, username, email, role 
      FROM users 
      ORDER BY id
    `);
    console.log(`📈 Total utilisateurs: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ID ${user.id}: ${user.username} (${user.email}) - Rôle: ${user.role}`);
    });

    // ==================== DIAGNOSTIC ====================
    console.log('\n🔍 ========== DIAGNOSTIC ==========');
    
    if (totalClients[0].total === 0) {
      console.log('⚠️ PROBLÈME: Aucun client dans la base de données!');
      console.log('   → Solution: Créez des clients via l\'interface "Clients" > "Ajouter un client"');
    } else {
      console.log('✅ Des clients existent dans la base');
    }

    if (totalFournisseurs[0].total === 0) {
      console.log('⚠️ PROBLÈME: Aucun fournisseur dans la base de données!');
      console.log('   → Solution: Créez des fournisseurs via l\'interface "Fournisseurs" > "Ajouter un fournisseur"');
    } else {
      console.log('✅ Des fournisseurs existent dans la base');
    }

    // Vérifier si l'utilisateur admin (ID 1) a des données
    const adminHasClients = clientsParUser.some(row => row.userId === 1 && row.nb_clients > 0);
    const adminHasFournisseurs = fournisseursParUser.some(row => row.userId === 1 && row.nb_fournisseurs > 0);

    if (!adminHasClients) {
      console.log('⚠️ L\'utilisateur admin (ID 1) n\'a aucun client');
      console.log('   → Connectez-vous avec admin/admin123 et créez des clients');
    } else {
      console.log('✅ L\'utilisateur admin a des clients');
    }

    if (!adminHasFournisseurs) {
      console.log('⚠️ L\'utilisateur admin (ID 1) n\'a aucun fournisseur');
      console.log('   → Connectez-vous avec admin/admin123 et créez des fournisseurs');
    } else {
      console.log('✅ L\'utilisateur admin a des fournisseurs');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 Connexion MySQL fermée');
    }
  }

  console.log('\n🔍 ========================================');
  console.log('🔍 Test terminé');
  console.log('🔍 ========================================');
}

// Exécuter le test
testClientsEtFournisseurs();
