// ============================================================================
// Script: Créer un utilisateur admin avec mot de passe hashé
// ============================================================================
// Usage: node create_admin_user.js
// ============================================================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || '212.192.3.44',
  user: process.env.DB_USER || 'default_db',
  password: process.env.DB_PASSWORD || 'Knachsoft@2024',
  database: process.env.DB_NAME || 'default_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function createAdminUser() {
  let connection;
  
  try {
    console.log('🔄 Connexion à MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à MySQL\n');

    // Vérifier si l'utilisateur admin existe déjà
    console.log('🔍 Vérification de l\'utilisateur admin...');
    const [existingUsers] = await connection.query(
      'SELECT id, username, email FROM users WHERE username = ?',
      ['admin']
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  L\'utilisateur admin existe déjà:');
      console.log('   ID:', existingUsers[0].id);
      console.log('   Username:', existingUsers[0].username);
      console.log('   Email:', existingUsers[0].email);
      console.log('\n❓ Voulez-vous mettre à jour le mot de passe? (Ctrl+C pour annuler)\n');
      
      // Attendre 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mettre à jour le mot de passe
      const password = 'admin123'; // Changez ce mot de passe!
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await connection.query(
        'UPDATE users SET password = ?, updatedAt = NOW() WHERE username = ?',
        [hashedPassword, 'admin']
      );
      
      console.log('✅ Mot de passe admin mis à jour avec succès!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ⚠️  CHANGEZ CE MOT DE PASSE EN PRODUCTION!\n');
      
    } else {
      // Créer un nouvel utilisateur admin
      console.log('📝 Création de l\'utilisateur admin...');
      
      const password = 'admin123'; // Changez ce mot de passe!
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await connection.query(
        `INSERT INTO users (username, email, password, nom, prenom, role, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@knachsoft.com', hashedPassword, 'Administrateur', 'Système', 'admin', true]
      );
      
      console.log('✅ Utilisateur admin créé avec succès!');
      console.log('   ID:', result.insertId);
      console.log('   Username: admin');
      console.log('   Email: admin@knachsoft.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
      console.log('   ⚠️  CHANGEZ CE MOT DE PASSE EN PRODUCTION!\n');
    }

    // Afficher tous les utilisateurs
    console.log('📋 Liste de tous les utilisateurs:');
    const [allUsers] = await connection.query(
      'SELECT id, username, email, nom, prenom, role, isActive, createdAt FROM users ORDER BY id'
    );
    
    console.table(allUsers);

    // Vérifier que toutes les tables ont userId
    console.log('\n🔍 Vérification des tables avec userId...');
    const [tables] = await connection.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND COLUMN_NAME = 'userId'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`✅ ${tables.length} tables ont la colonne userId:`);
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    console.log('\n✅ Configuration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Changez le mot de passe admin en production');
    console.log('   2. Créez les routes d\'authentification (auth.js)');
    console.log('   3. Créez le middleware JWT (middleware/auth.js)');
    console.log('   4. Protégez toutes vos routes avec le middleware');
    console.log('   5. Mettez à jour l\'application Flutter pour gérer JWT\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion MySQL fermée');
    }
  }
}

// Fonction pour créer un utilisateur personnalisé
async function createCustomUser(username, email, password, nom, prenom, role = 'user') {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Vérifier si l'utilisateur existe déjà
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existing.length > 0) {
      console.log('❌ Un utilisateur avec ce username ou email existe déjà');
      return null;
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur
    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, nom, prenom, role, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, nom, prenom, role, true]
    );
    
    console.log('✅ Utilisateur créé avec succès!');
    console.log('   ID:', result.insertId);
    console.log('   Username:', username);
    console.log('   Email:', email);
    console.log('   Role:', role);
    
    return result.insertId;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser, createCustomUser };
