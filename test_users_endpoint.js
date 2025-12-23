// ============================================================================
// TEST: Vérifier l'endpoint GET /api/users
// ============================================================================
// Ce script teste l'endpoint /api/users avec un token JWT valide
// ============================================================================

const http = require('http');

// Configuration
const API_URL = 'http://localhost:4000';

// Fonction pour faire une requête HTTP
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testUsersEndpoint() {
  console.log('🧪 TEST: Endpoint GET /api/users\n');
  console.log('=' .repeat(60));

  try {
    // Étape 1: Vérifier que le serveur répond
    console.log('\n📡 Étape 1: Vérification du serveur...');
    const healthCheck = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Réponse:`, healthCheck.data);

    if (healthCheck.status !== 200) {
      console.log('\n❌ Le serveur ne répond pas correctement!');
      console.log('   Assurez-vous que le serveur est démarré: node server.js');
      return;
    }

    // Étape 2: Se connecter pour obtenir un token
    console.log('\n🔐 Étape 2: Connexion pour obtenir un token JWT...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
      username: 'admin',
      password: 'admin123'
    });

    console.log(`   Status: ${loginResponse.status}`);

    if (loginResponse.status !== 200) {
      console.log('   ❌ Échec de connexion!');
      console.log('   Réponse:', loginResponse.data);
      console.log('\n💡 Essayez de créer un utilisateur admin:');
      console.log('   node create_main_admin.js');
      return;
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`   ✅ Connecté en tant que: ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Étape 3: Tester l'endpoint /api/users
    console.log('\n👥 Étape 3: Test de GET /api/users...');
    const usersResponse = await makeRequest('GET', '/api/users', {
      'Authorization': `Bearer ${token}`
    });

    console.log(`   Status: ${usersResponse.status}`);

    if (usersResponse.status === 200) {
      console.log(`   ✅ Succès! ${usersResponse.data.length} utilisateur(s) récupéré(s)`);
      console.log('\n📋 Liste des utilisateurs:');
      usersResponse.data.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.username} (ID: ${u.id}, Role: ${u.role}, ownerId: ${u.ownerId || 'null'})`);
      });
    } else if (usersResponse.status === 404) {
      console.log('   ❌ Erreur 404 - Route non trouvée!');
      console.log('   Réponse:', usersResponse.data);
      console.log('\n🔍 Vérifications à faire:');
      console.log('   1. Le serveur a-t-il été redémarré après les modifications?');
      console.log('   2. La route est-elle bien définie dans server.js?');
      console.log('   3. Y a-t-il des erreurs au démarrage du serveur?');
    } else if (usersResponse.status === 401) {
      console.log('   ❌ Erreur 401 - Token invalide!');
      console.log('   Réponse:', usersResponse.data);
    } else {
      console.log(`   ❌ Erreur ${usersResponse.status}`);
      console.log('   Réponse:', usersResponse.data);
    }

    // Étape 4: Vérifier les logs du serveur
    console.log('\n📊 Étape 4: Vérification des logs');
    console.log('   Regardez la console du serveur Node.js pour voir:');
    console.log('   - 🔍 [API] GET /api/users - Début de la requête');
    console.log('   - 🔍 [API] userId extrait du JWT: ...');
    console.log('   - ✅ [API] X utilisateur(s) récupéré(s)');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('   Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test terminé\n');
}

// Exécuter le test
testUsersEndpoint();
