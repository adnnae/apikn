// Vérifier les utilisateurs dans la base de données
require('dotenv').config();
const { pool } = require('./db');

async function checkUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs...\n');
    
    const [users] = await pool.query('SELECT id, username, email, role, ownerId FROM users ORDER BY id');
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      console.log('\n💡 Solution: Créer un utilisateur admin');
      console.log('   node create_admin_user.js');
    } else {
      console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
      users.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email || '(vide)'}`);
        console.log(`   Role: ${user.role || '(vide)'}`);
        console.log(`   OwnerId: ${user.ownerId || '(vide)'}`);
        console.log('   ---');
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
