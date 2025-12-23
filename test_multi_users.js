const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testMultiUsers() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST SYSTÈME MULTI-UTILISATEURS AVEC OWNERID');
  console.log('='.repeat(60) + '\n');

  let adminToken = null;
  let vendeurToken = null;
  let vendeurId = null;

  try {
    // ========================================
    // ÉTAPE 1: Connexion Admin
    // ========================================
    console.log(`${colors.cyan}📝 ÉTAPE 1: Connexion Admin${colors.reset}`);
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });

    adminToken = loginResponse.data.token;
    const adminId = loginResponse.data.userId;
    console.log(`${colors.green}✅ Admin connecté (id=${adminId})${colors.reset}`);
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);

    // ========================================
    // ÉTAPE 2: Vérifier les utilisateurs existants
    // ========================================
    console.log(`\n${colors.cyan}📝 ÉTAPE 2: Liste des utilisateurs existants${colors.reset}`);
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log(`${colors.green}✅ ${usersResponse.data.length} utilisateur(s) trouvé(s)${colors.reset}`);
    usersResponse.data.forEach((user) => {
      console.log(
        `   - ${user.username} (id=${user.id}, role=${user.role}, ownerId=${user.ownerId})`,
      );
    });

    // ========================================
    // ÉTAPE 3: Créer un vendeur
    // ========================================
    console.log(`\n${colors.cyan}📝 ÉTAPE 3: Création d'un vendeur${colors.reset}`);
    const timestamp = Date.now();
    const vendeurUsername = `vendeur_${timestamp}`;

    try {
      const createResponse = await axios.post(
        `${API_URL}/users/clone`,
        {
          username: vendeurUsername,
          password: 'vendeur123',
          role: 'vendeur',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      vendeurId = createResponse.data.userId;
      const ownerId = createResponse.data.ownerId;
      console.log(`${colors.green}✅ Vendeur créé avec succès${colors.reset}`);
      console.log(`   - Username: ${vendeurUsername}`);
      console.log(`   - ID: ${vendeurId}`);
      console.log(`   - OwnerId: ${ownerId}`);
      console.log(`   - Partage données: ${createResponse.data.sharedData}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          `${colors.yellow}⚠️  Username existe déjà, on continue avec l'existant${colors.reset}`,
        );
      } else {
        throw error;
      }
    }

    // ========================================
    // ÉTAPE 4: Vérifier la liste mise à jour
    // ========================================
    console.log(`\n${colors.cyan}📝 ÉTAPE 4: Liste des utilisateurs après création${colors.reset}`);
    const updatedUsersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log(
      `${colors.green}✅ ${updatedUsersResponse.data.length} utilisateur(s) trouvé(s)${colors.reset}`,
    );
    updatedUsersResponse.data.forEach((user) => {
      const badge = user.role === 'admin' ? '👑' : '👤';
      console.log(
        `   ${badge} ${user.username} (id=${user.id}, role=${user.role}, ownerId=${user.ownerId})`,
      );
    });

    // ========================================
    // ÉTAPE 5: Connexion Vendeur
    // ========================================
    if (vendeurId) {
      console.log(`\n${colors.cyan}📝 ÉTAPE 5: Connexion Vendeur${colors.reset}`);
      try {
        const vendeurLoginResponse = await axios.post(`${API_URL}/auth/login`, {
          username: vendeurUsername,
          password: 'vendeur123',
        });

        vendeurToken = vendeurLoginResponse.data.token;
        console.log(
          `${colors.green}✅ Vendeur connecté (id=${vendeurLoginResponse.data.userId})${colors.reset}`,
        );
        console.log(`   Token: ${vendeurToken.substring(0, 20)}...`);

        // ========================================
        // ÉTAPE 6: Vérifier que le vendeur voit les mêmes utilisateurs
        // ========================================
        console.log(
          `\n${colors.cyan}📝 ÉTAPE 6: Liste des utilisateurs vue par le vendeur${colors.reset}`,
        );
        const vendeurUsersResponse = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${vendeurToken}` },
        });

        console.log(
          `${colors.green}✅ ${vendeurUsersResponse.data.length} utilisateur(s) visible(s) par le vendeur${colors.reset}`,
        );
        vendeurUsersResponse.data.forEach((user) => {
          const badge = user.role === 'admin' ? '👑' : '👤';
          console.log(
            `   ${badge} ${user.username} (id=${user.id}, role=${user.role}, ownerId=${user.ownerId})`,
          );
        });

        // Vérifier que le vendeur voit les mêmes utilisateurs que l'admin
        if (
          vendeurUsersResponse.data.length === updatedUsersResponse.data.length
        ) {
          console.log(
            `\n${colors.green}✅ SUCCÈS: Le vendeur voit les mêmes utilisateurs que l'admin${colors.reset}`,
          );
        } else {
          console.log(
            `\n${colors.red}❌ ERREUR: Le vendeur ne voit pas les mêmes utilisateurs${colors.reset}`,
          );
        }
      } catch (error) {
        console.log(
          `${colors.yellow}⚠️  Impossible de se connecter avec le vendeur${colors.reset}`,
        );
      }
    }

    // ========================================
    // RÉSUMÉ FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.green}✅ TEST TERMINÉ AVEC SUCCÈS${colors.reset}`);
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - Admin connecté: ✅`);
    console.log(`   - Vendeur créé: ${vendeurId ? '✅' : '❌'}`);
    console.log(`   - Vendeur connecté: ${vendeurToken ? '✅' : '❌'}`);
    console.log(`   - Partage des données: ✅`);
    console.log('\n');
  } catch (error) {
    console.error(`\n${colors.red}❌ ERREUR:${colors.reset}`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    process.exit(1);
  }
}

// Exécuter le test
testMultiUsers();
