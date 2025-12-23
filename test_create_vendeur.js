const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testCreateVendeur() {
  console.log('\n🧪 TEST CRÉATION VENDEUR\n');

  try {
    // 1. Connexion admin
    console.log('1️⃣ Connexion admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.userId;
    console.log(`✅ Admin connecté (userId=${userId})`);

    // 2. Vérifier l'ownerId de l'admin
    console.log('\n2️⃣ Vérification ownerId admin...');
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const adminUser = usersResponse.data.find((u) => u.id === userId);
    console.log(`Admin: id=${adminUser.id}, ownerId=${adminUser.ownerId}`);

    if (!adminUser.ownerId) {
      console.log('❌ PROBLÈME: Admin n\'a pas de ownerId !');
      console.log('   Exécutez: UPDATE users SET ownerId = id WHERE id = 1;');
      return;
    }

    // 3. Créer un vendeur
    console.log('\n3️⃣ Création vendeur...');
    const timestamp = Date.now();
    const vendeurUsername = `vendeur_${timestamp}`;

    const createResponse = await axios.post(
      `${API_URL}/users/clone`,
      {
        username: vendeurUsername,
        password: 'vendeur123',
        role: 'vendeur',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log('✅ Vendeur créé:');
    console.log(`   Username: ${vendeurUsername}`);
    console.log(`   ID: ${createResponse.data.userId}`);
    console.log(`   OwnerId: ${createResponse.data.ownerId}`);

    // 4. Vérifier dans la base
    console.log('\n4️⃣ Vérification finale...');
    const finalUsersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`\n📊 ${finalUsersResponse.data.length} utilisateur(s):`);
    finalUsersResponse.data.forEach((user) => {
      const badge = user.role === 'admin' ? '👑' : '👤';
      console.log(
        `   ${badge} ${user.username} (id=${user.id}, ownerId=${user.ownerId})`,
      );
    });

    console.log('\n✅ TEST RÉUSSI\n');
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('\n');
  }
}

testCreateVendeur();
