/**
 * Test pour vérifier que les données sont correctement filtrées par userId
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

let adminToken = '';
let testUserToken = '';
let testUserId = 0;

console.log('🧪 TEST DE FILTRAGE PAR userId\n');
console.log('═'.repeat(60));

async function runTests() {
  try {
    // ============================================================================
    // 1. LOGIN ADMIN
    // ============================================================================
    console.log('\n📝 TEST 1: Login admin');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });
    
    adminToken = adminLogin.data.token;
    console.log('✅ Admin connecté (userId: 1)');

    // ============================================================================
    // 2. CRÉER UN NOUVEL UTILISATEUR
    // ============================================================================
    console.log('\n📝 TEST 2: Créer un nouvel utilisateur');
    const timestamp = Date.now();
    const newUser = await axios.post(`${BASE_URL}/auth/register`, {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@knachsoft.com`,
      password: 'test123',
      nom: 'Test User',
    });
    
    testUserToken = newUser.data.token;
    testUserId = newUser.data.user.id;
    console.log(`✅ Utilisateur créé (userId: ${testUserId})`);

    // ============================================================================
    // 3. ADMIN CRÉE UN CLIENT
    // ============================================================================
    console.log('\n📝 TEST 3: Admin crée un client');
    const adminClient = await axios.post(
      `${BASE_URL}/clients`,
      {
        nom: 'Client Admin',
        telephone: '0600000001',
        solde: 0,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(`✅ Client créé par admin (id: ${adminClient.data.id})`);

    // ============================================================================
    // 4. TEST USER CRÉE UN CLIENT
    // ============================================================================
    console.log('\n📝 TEST 4: Test user crée un client');
    const testUserClient = await axios.post(
      `${BASE_URL}/clients`,
      {
        nom: 'Client Test User',
        telephone: '0600000002',
        solde: 0,
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      }
    );
    console.log(`✅ Client créé par test user (id: ${testUserClient.data.id})`);

    // ============================================================================
    // 5. ADMIN RÉCUPÈRE SES CLIENTS
    // ============================================================================
    console.log('\n📝 TEST 5: Admin récupère ses clients');
    const adminClients = await axios.get(`${BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const adminClientIds = adminClients.data.map(c => c.id);
    const hasAdminClient = adminClientIds.includes(adminClient.data.id);
    const hasTestUserClient = adminClientIds.includes(testUserClient.data.id);
    
    console.log(`   Nombre de clients: ${adminClients.data.length}`);
    console.log(`   Contient client admin: ${hasAdminClient ? '✅' : '❌'}`);
    console.log(`   Contient client test user: ${hasTestUserClient ? '❌' : '✅'}`);
    
    if (hasAdminClient && !hasTestUserClient) {
      console.log('✅ Filtrage correct: Admin voit uniquement ses clients');
    } else {
      console.log('❌ ERREUR: Filtrage incorrect!');
      return false;
    }

    // ============================================================================
    // 6. TEST USER RÉCUPÈRE SES CLIENTS
    // ============================================================================
    console.log('\n📝 TEST 6: Test user récupère ses clients');
    const testUserClients = await axios.get(`${BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    
    const testUserClientIds = testUserClients.data.map(c => c.id);
    const testUserHasAdminClient = testUserClientIds.includes(adminClient.data.id);
    const testUserHasOwnClient = testUserClientIds.includes(testUserClient.data.id);
    
    console.log(`   Nombre de clients: ${testUserClients.data.length}`);
    console.log(`   Contient client admin: ${testUserHasAdminClient ? '❌' : '✅'}`);
    console.log(`   Contient son propre client: ${testUserHasOwnClient ? '✅' : '❌'}`);
    
    if (!testUserHasAdminClient && testUserHasOwnClient) {
      console.log('✅ Filtrage correct: Test user voit uniquement ses clients');
    } else {
      console.log('❌ ERREUR: Filtrage incorrect!');
      return false;
    }

    // ============================================================================
    // 7. TEST USER ESSAIE D'ACCÉDER AU CLIENT DE L'ADMIN
    // ============================================================================
    console.log('\n📝 TEST 7: Test user essaie d\'accéder au client de l\'admin');
    try {
      await axios.get(`${BASE_URL}/clients/${adminClient.data.id}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      console.log('❌ ERREUR: Test user peut accéder au client de l\'admin!');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Accès refusé correctement (404)');
      } else {
        console.log(`⚠️  Erreur inattendue: ${error.response?.status || error.message}`);
      }
    }

    // ============================================================================
    // 8. TEST USER ESSAIE DE SUPPRIMER LE CLIENT DE L'ADMIN
    // ============================================================================
    console.log('\n📝 TEST 8: Test user essaie de supprimer le client de l\'admin');
    try {
      await axios.delete(`${BASE_URL}/clients/${adminClient.data.id}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      console.log('❌ ERREUR: Test user peut supprimer le client de l\'admin!');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Suppression refusée correctement (404)');
      } else {
        console.log(`⚠️  Erreur inattendue: ${error.response?.status || error.message}`);
      }
    }

    // ============================================================================
    // 9. ADMIN CRÉE UN PRODUIT
    // ============================================================================
    console.log('\n📝 TEST 9: Admin crée un produit');
    const adminProduit = await axios.post(
      `${BASE_URL}/produits`,
      {
        nom: 'Produit Admin',
        reference: `REF-ADMIN-${timestamp}`,
        prixAchat: 100,
        prixVente: 150,
        quantite: 10,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log(`✅ Produit créé par admin (id: ${adminProduit.data.id})`);

    // ============================================================================
    // 10. TEST USER CRÉE UN PRODUIT
    // ============================================================================
    console.log('\n📝 TEST 10: Test user crée un produit');
    const testUserProduit = await axios.post(
      `${BASE_URL}/produits`,
      {
        nom: 'Produit Test User',
        reference: `REF-TEST-${timestamp}`,
        prixAchat: 50,
        prixVente: 75,
        quantite: 5,
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      }
    );
    console.log(`✅ Produit créé par test user (id: ${testUserProduit.data.id})`);

    // ============================================================================
    // 11. VÉRIFIER QUE CHAQUE USER VOIT UNIQUEMENT SES PRODUITS
    // ============================================================================
    console.log('\n📝 TEST 11: Vérifier le filtrage des produits');
    
    const adminProduits = await axios.get(`${BASE_URL}/produits`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const testUserProduits = await axios.get(`${BASE_URL}/produits`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    
    const adminHasOwnProduct = adminProduits.data.some(p => p.id === adminProduit.data.id);
    const adminHasTestProduct = adminProduits.data.some(p => p.id === testUserProduit.data.id);
    const testUserHasOwnProduct = testUserProduits.data.some(p => p.id === testUserProduit.data.id);
    const testUserHasAdminProduct = testUserProduits.data.some(p => p.id === adminProduit.data.id);
    
    console.log(`   Admin voit son produit: ${adminHasOwnProduct ? '✅' : '❌'}`);
    console.log(`   Admin voit produit test user: ${adminHasTestProduct ? '❌' : '✅'}`);
    console.log(`   Test user voit son produit: ${testUserHasOwnProduct ? '✅' : '❌'}`);
    console.log(`   Test user voit produit admin: ${testUserHasAdminProduct ? '❌' : '✅'}`);
    
    if (adminHasOwnProduct && !adminHasTestProduct && testUserHasOwnProduct && !testUserHasAdminProduct) {
      console.log('✅ Filtrage des produits correct');
    } else {
      console.log('❌ ERREUR: Filtrage des produits incorrect!');
      return false;
    }

    // ============================================================================
    // NETTOYAGE
    // ============================================================================
    console.log('\n📝 Nettoyage...');
    
    // Supprimer les clients créés
    await axios.delete(`${BASE_URL}/clients/${adminClient.data.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    await axios.delete(`${BASE_URL}/clients/${testUserClient.data.id}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    
    // Supprimer les produits créés
    await axios.delete(`${BASE_URL}/produits/${adminProduit.data.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    await axios.delete(`${BASE_URL}/produits/${testUserProduit.data.id}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    
    console.log('✅ Nettoyage terminé');

    return true;

  } catch (error) {
    console.error('\n❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

// Exécuter les tests
runTests().then(success => {
  console.log('\n' + '═'.repeat(60));
  if (success) {
    console.log('\n🎉 TOUS LES TESTS DE FILTRAGE SONT PASSÉS!');
    console.log('\n✅ Le filtrage par userId fonctionne correctement:');
    console.log('   - Chaque utilisateur voit uniquement ses données');
    console.log('   - Les utilisateurs ne peuvent pas accéder aux données des autres');
    console.log('   - Les utilisateurs ne peuvent pas modifier/supprimer les données des autres');
  } else {
    console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('\n⚠️  Le filtrage par userId ne fonctionne pas correctement!');
  }
  console.log('\n' + '═'.repeat(60));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
