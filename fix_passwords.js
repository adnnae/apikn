const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function fixPasswords() {
  console.log('\n🔐 CORRECTION DES MOTS DE PASSE NON HASHÉS\n');

  try {
    // 1. Récupérer tous les utilisateurs
    const [users] = await pool.query('SELECT id, username, password FROM users');

    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

    let fixed = 0;
    let alreadyHashed = 0;

    for (const user of users) {
      // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`✅ ${user.username} - Déjà hashé`);
        alreadyHashed++;
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Mettre à jour dans la base
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [
        hashedPassword,
        user.id,
      ]);

      console.log(`🔧 ${user.username} - Mot de passe hashé (était: ${user.password})`);
      fixed++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Correction terminée:`);
    console.log(`   - ${alreadyHashed} déjà hashé(s)`);
    console.log(`   - ${fixed} corrigé(s)`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixPasswords();
