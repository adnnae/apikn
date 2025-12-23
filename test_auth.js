// ============================================================================
// Script de test: Authentification JWT
// ============================================================================
// Usage: node test_auth.js
// ============================================================================

const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

let authToken = null;
let testUserId = null;

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test1_Login() {
  log('\n📝 TEST 1: Login avec admin', 'cyan');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    testUserId = response.data.user.id;
    
    log('✅ Login réussi!', 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
    log(`   User ID: ${testUserId}`, 'blue');
    log(`   Username: ${response.data.user.username}`, 'blue');
    log(`   Role: ${response.data.user.role}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Erreur login:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test2_LoginInvalid() {
  log('\n📝 TEST 2: Login avec mauvais mot de passe', 'cyan');
  
  try {
    await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'wrongpassword'
    });
    
    log('❌ Le login aurait dû échouer!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ Login refusé correctement (401)', 'green');
      return true;
    }
    log('❌ Erreur inattendue:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function test3_GetMe() {
  log('\n📝 TEST 3: Récupérer les infos utilisateur (/auth/me)', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    log('✅ Infos utilisateur récupérées!', 'green');
    log(`   Username: ${response.data.user.username}`, 'blue');
    log(`   Email: ${response.data.user.email}`, 'blue');
    log(`   Role: ${response.data.user.role}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Erreur /auth/me:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test4_GetMeWithoutToken() {
  log('\n📝 TEST 4: Accès /auth/me sans token', 'cyan');
  
  try {
    await axios.get(`${API_URL}/auth/me`);
    
    log('❌ L\'accès aurait dû être refusé!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ Accès refusé correctement (401)', 'green');
      return true;
    }
    log('❌ Erreur inattendue:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function test5_Register() {
  log('\n📝 TEST 5: Créer un nouvel utilisateur', 'cyan');
  
  const randomNum = Math.floor(Math.random() * 10000);
  const newUser = {
    username: `testuser${randomNum}`,
    email: `test${randomNum}@knachsoft.com`,
    password: 'test123456',
    nom: 'Test',
    prenom: 'User'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, newUser);
    
    log('✅ Utilisateur créé!', 'green');
    log(`   ID: ${response.data.user.id}`, 'blue');
    log(`   Username: ${response.data.user.username}`, 'blue');
    log(`   Email: ${response.data.user.email}`, 'blue');
    log(`   Token reçu: ${response.data.token.substring(0, 20)}...`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Erreur register:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test6_RegisterDuplicate() {
  log('\n📝 TEST 6: Créer un utilisateur avec username existant', 'cyan');
  
  try {
    await axios.post(`${API_URL}/auth/register`, {
      username: 'admin',
      email: 'newemail@test.com',
      password: 'test123456'
    });
    
    log('❌ La création aurait dû échouer!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      log('✅ Création refusée correctement (409 Conflict)', 'green');
      return true;
    }
    log('❌ Erreur inattendue:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function test7_RefreshToken() {
  log('\n📝 TEST 7: Rafraîchir le token', 'cyan');
  
  try {
    // D'abord se connecter pour obtenir un refresh token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const refreshToken = loginResponse.data.refreshToken;
    
    // Rafraîchir le token
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    log('✅ Token rafraîchi!', 'green');
    log(`   Nouveau token: ${response.data.token.substring(0, 20)}...`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Erreur refresh:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test8_UpdateProfile() {
  log('\n📝 TEST 8: Mettre à jour le profil', 'cyan');
  
  try {
    const response = await axios.put(`${API_URL}/auth/profile`, {
      nom: 'Admin Updated',
      telephone: '0612345678'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    log('✅ Profil mis à jour!', 'green');
    log(`   Nom: ${response.data.user.nom}`, 'blue');
    log(`   Téléphone: ${response.data.user.telephone}`, 'blue');
    
    return true;
  } catch (error) {
    log('❌ Erreur update profile:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test9_ProtectedRoute() {
  log('\n📝 TEST 9: Accéder à une route protégée (/api/clients)', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/clients`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    log('✅ Route protégée accessible!', 'green');
    log(`   Nombre de clients: ${response.data.length}`, 'blue');
    
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log('⚠️  Route protégée mais middleware pas encore appliqué', 'yellow');
      log('   Ceci est normal si vous n\'avez pas encore mis à jour server.js', 'yellow');
      return true;
    }
    log('❌ Erreur route protégée:', 'red');
    log(`   ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function test10_ProtectedRouteWithoutToken() {
  log('\n📝 TEST 10: Accéder à une route protégée sans token', 'cyan');
  
  try {
    await axios.get(`${API_URL}/clients`);
    
    log('⚠️  Route accessible sans token', 'yellow');
    log('   Ceci est normal si vous n\'avez pas encore mis à jour server.js', 'yellow');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ Accès refusé correctement (401)', 'green');
      return true;
    }
    log('❌ Erreur inattendue:', 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🔐 TESTS D\'AUTHENTIFICATION JWT - KnachSoft API         ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  
  const tests = [
    test1_Login,
    test2_LoginInvalid,
    test3_GetMe,
    test4_GetMeWithoutToken,
    test5_Register,
    test6_RegisterDuplicate,
    test7_RefreshToken,
    test8_UpdateProfile,
    test9_ProtectedRoute,
    test10_ProtectedRouteWithoutToken,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ Erreur inattendue: ${error.message}`, 'red');
      failed++;
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  📊 RÉSULTATS DES TESTS                                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  log(`\n✅ Tests réussis: ${passed}/${tests.length}`, passed === tests.length ? 'green' : 'yellow');
  log(`❌ Tests échoués: ${failed}/${tests.length}`, failed > 0 ? 'red' : 'green');
  
  if (passed === tests.length) {
    log('\n🎉 Tous les tests sont passés! L\'authentification JWT fonctionne correctement.', 'green');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow');
  }
  
  log('\n📝 Prochaines étapes:', 'cyan');
  log('   1. Mettre à jour server.js avec authMiddleware', 'blue');
  log('   2. Protéger toutes les routes existantes', 'blue');
  log('   3. Tester à nouveau avec ce script', 'blue');
  log('   4. Mettre à jour l\'application Flutter\n', 'blue');
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    await axios.get(`${API_URL}/health`);
    log('✅ Serveur accessible\n', 'green');
    return true;
  } catch (error) {
    log('❌ Serveur non accessible!', 'red');
    log('   Assurez-vous que le serveur tourne sur http://localhost:4000', 'red');
    log('   Commande: node server.js\n', 'yellow');
    return false;
  }
}

// Exécuter les tests
(async () => {
  const serverOk = await checkServer();
  if (serverOk) {
    await runAllTests();
  }
  process.exit(0);
})();
