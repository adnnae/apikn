// Test simple du clonage d'utilisateur
const http = require('http');

// 1. Login pour obtenir le token
function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(body);
          console.log('✅ Login réussi, token:', result.token.substring(0, 20) + '...');
          resolve(result.token);
        } else {
          console.error('❌ Login échoué:', res.statusCode, body);
          reject(new Error('Login failed'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 2. Cloner l'utilisateur
function cloneUser(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: 'test_vendeur_' + Date.now(),
      password: 'test123',
      role: 'vendeur'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/users/clone',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\n📊 Réponse du serveur:');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        
        if (res.statusCode === 201) {
          console.log('✅ Clonage réussi!');
          resolve(JSON.parse(body));
        } else {
          console.error('❌ Clonage échoué');
          reject(new Error('Clone failed'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Erreur réseau:', err);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// Exécuter le test
async function test() {
  try {
    console.log('🧪 Test de clonage d\'utilisateur\n');
    const token = await login();
    await cloneUser(token);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

test();
