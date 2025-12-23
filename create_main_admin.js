// ============================================================================
// Créer l'utilisateur admin principal (owner)
// ============================================================================
// Ce script crée l'utilisateur admin avec id=1 et ownerId=1
// ============================================================================

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function createMainAdmin() {
  try {
    console.log('🚀 Création de l\'utilisateur admin principal...\n');
    
    // Vérifier si l'utilisateur id=1 existe déjà
    const [existing] = await pool.query('SELECT id, username FROM users WHERE id = 1');
    
    if (existing.length > 0) {
      console.log(`✅ L'utilisateur admin existe déjà: ${existing[0].username} (id=1)`);
      console.log('   Rien à faire.');
      return;
    }
    
    // Hash du mot de passe
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer l'utilisateur admin avec id=1
    await pool.query(
      `INSERT INTO users (id, username, password, email, role, ownerId, createdAt, updatedAt)
       VALUES (1, 'admin', ?, 'admin@knachsoft.com', 'admin', 1, NOW(), NOW())`,
      [hashedPassword]
    );
    
    console.log('✅ Utilisateur admin créé avec succès!');
    console.log('   ID: 1');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@knachsoft.com');
    console.log('   Role: admin');
    console.log('   OwnerId: 1');
    console.log('\n📝 Vous pouvez maintenant vous connecter avec:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('\n💡 L\'utilisateur existe déjà. Utilisez:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
  } finally {
    await pool.end();
  }
}

createMainAdmin();
