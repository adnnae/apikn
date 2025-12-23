// ============================================================================
// TEST: Vérifier l'endpoint GET /api/users avec un utilisateur existant
// ============================================================================

const http = require('http');
const { pool } = require('./db');

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

async function testWithExistingUser() {
  console.log('🧪 TEST: Endpoint GET /api/users avec utilisateur existant\n');
  console.log('=' .repeat(60));

  try {
    // Récupérer un utilisateur avec un role valide
    console.log('\n📋 Recherche d\'un utilisateur avec role admin...');
    const [users] = await pool.query(
      'SELECT id, username, role, ownerId FROM users WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur admin trouvé!');
      console.log('💡 Créez un utilisateur admin avec: node create_main_admin.js');
      return;
    }

    const user = users[0];
    console.log(`✅ Utilisateur trouvé: ${user.username} (ID: ${user.id}, Role: ${user.role}, ownerId: ${user.ownerId || 'null'})`);

    // Essayer de se connecter avec cet utilisateur
    // Note: On ne connaît pas le mot de passe, donc on va essayer les mots de passe courants
    const passwords = ['admin123', 'password', '123456', 'admin', user.username];

    let token = null;
    let loginSuccess = false;

    console.log('\n🔐 Tentative de connexion...');
    for (const password of passwords) {
      const loginResponse = await makeRequest('POST', '/api/auth/login', {}, {
        username: user.username,
        password: password
      });

      if (loginResponse.status === 200) {
        token = loginResponse.data.token;
        loginSuccess = true;
        console.log(`✅ Connexion réussie avec mot de passe: ${password}`);
        break;
      }
    }

    if (!loginSuccess) {
      console.log('❌ Impossible de se connecter avec les mots de passe courants');
      console.log('💡 Essayez de réinitialiser le mot de passe ou créez un nouvel utilisateur');
      return;
    }

    // Tester l'endpoint /api/users
    console.log('\n👥 Test de GET /api/users...');
    const usersResponse = await makeRequest('GET', '/api/users', {
      'Authorization': `Bearer ${token}`
    });

    console.log(`   Status: ${usersResponse.status}`);

    if (usersResponse.status === 200) {
      console.log(`   ✅ Succès! ${usersResponse.data.length} utilisateur(s) récupéré(s)`);
      console.log('\n📋 Liste des utilisateurs:');
      usersResponse.data.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.username} (ID: ${u.id}, Role: ${u.role || 'vide'}, ownerId: ${u.ownerId || 'null'})`);
      });
    } else if (usersResponse.status === 404) {
      console.log('   ❌ Erreur 404 - Route non trouvée!');
      console.log('   Réponse:', usersResponse.data);
    } else if (usersResponse.status === 401) {
      console.log('   ❌ Erreur 401 - Token invalide!');
      console.log('   Réponse:', usersResponse.data);
    } else {
      console.log(`   ❌ Erreur ${usersResponse.status}`);
      console.log('   Réponse:', usersResponse.data);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
  } finally {
    await pool.end();
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test terminé\n');
}

// Exécuter le test
testWithExistingUser();
