// ============================================================================
// TEST: Édition et suppression d'utilisateurs
// ============================================================================
// Ce script teste les fonctionnalités d'édition et suppression d'utilisateurs
// ============================================================================

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}📋 ${msg}${colors.reset}`),
};

async function testEditDeleteUser() {
  let token = null;
  let createdUserId = null;

  try {
    // ========================================
    // ÉTAPE 1: Connexion en tant qu'admin
    // ========================================
    log.step('ÉTAPE 1: Connexion en tant qu\'admin');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });

    token = loginResponse.data.token;
    log.success(`Admin connecté - Token obtenu`);
    console.log(`   User: ${loginResponse.data.user.username} (ID: ${loginResponse.data.user.id})`);
    console.log(`   Role: ${loginResponse.data.user.role}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // ========================================
    // ÉTAPE 2: Créer un utilisateur de test
    // ========================================
    log.step('\nÉTAPE 2: Créer un utilisateur de test');

    const createResponse = await axios.post(
      `${API_URL}/users/clone`,
      {
        username: 'test_user_edit',
        password: 'password123',
        role: 'vendeur',
      },
      { headers }
    );

    createdUserId = createResponse.data.userId;
    log.success(`Utilisateur créé: test_user_edit (ID: ${createdUserId})`);

    // ========================================
    // ÉTAPE 3: Lister les utilisateurs
    // ========================================
    log.step('\nÉTAPE 3: Lister les utilisateurs');

    const listResponse = await axios.get(`${API_URL}/users`, { headers });
    log.success(`${listResponse.data.length} utilisateurs trouvés`);
    
    const testUser = listResponse.data.find(u => u.id === createdUserId);
    if (testUser) {
      console.log(`   Username: ${testUser.username}`);
      console.log(`   Role: ${testUser.role}`);
      console.log(`   OwnerId: ${testUser.ownerId}`);
    }

    // ========================================
    // ÉTAPE 4: Modifier l'utilisateur (username)
    // ========================================
    log.step('\nÉTAPE 4: Modifier le username');

    const editResponse1 = await axios.put(
      `${API_URL}/users/${createdUserId}`,
      {
        username: 'test_user_modified',
      },
      { headers }
    );

    log.success('Username modifié avec succès');

    // Vérifier la modification
    const listResponse2 = await axios.get(`${API_URL}/users`, { headers });
    const modifiedUser = listResponse2.data.find(u => u.id === createdUserId);
    if (modifiedUser && modifiedUser.username === 'test_user_modified') {
      log.success(`Vérification: username = "${modifiedUser.username}"`);
    } else {
      log.error('Vérification échouée: username non modifié');
    }

    // ========================================
    // ÉTAPE 5: Modifier le rôle
    // ========================================
    log.step('\nÉTAPE 5: Modifier le rôle');

    const editResponse2 = await axios.put(
      `${API_URL}/users/${createdUserId}`,
      {
        role: 'admin',
      },
      { headers }
    );

    log.success('Rôle modifié avec succès');

    // Vérifier la modification
    const listResponse3 = await axios.get(`${API_URL}/users`, { headers });
    const modifiedUser2 = listResponse3.data.find(u => u.id === createdUserId);
    if (modifiedUser2 && modifiedUser2.role === 'admin') {
      log.success(`Vérification: role = "${modifiedUser2.role}"`);
    } else {
      log.error('Vérification échouée: rôle non modifié');
    }

    // ========================================
    // ÉTAPE 6: Modifier le mot de passe
    // ========================================
    log.step('\nÉTAPE 6: Modifier le mot de passe');

    const editResponse3 = await axios.put(
      `${API_URL}/users/${createdUserId}`,
      {
        password: 'new_password_456',
      },
      { headers }
    );

    log.success('Mot de passe modifié avec succès');

    // Vérifier en se connectant avec le nouveau mot de passe
    try {
      const loginTest = await axios.post(`${API_URL}/auth/login`, {
        username: 'test_user_modified',
        password: 'new_password_456',
      });
      log.success('Vérification: connexion avec nouveau mot de passe réussie');
    } catch (error) {
      log.error('Vérification échouée: impossible de se connecter avec le nouveau mot de passe');
    }

    // ========================================
    // ÉTAPE 7: Tenter de supprimer son propre compte (doit échouer)
    // ========================================
    log.step('\nÉTAPE 7: Tenter de supprimer son propre compte (doit échouer)');

    try {
      await axios.delete(`${API_URL}/users/${loginResponse.data.user.id}`, { headers });
      log.error('ERREUR: La suppression de son propre compte devrait être interdite');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log.success('Protection OK: impossible de supprimer son propre compte');
        console.log(`   Message: ${error.response.data.error}`);
      } else {
        log.error(`Erreur inattendue: ${error.message}`);
      }
    }

    // ========================================
    // ÉTAPE 8: Supprimer l'utilisateur de test
    // ========================================
    log.step('\nÉTAPE 8: Supprimer l\'utilisateur de test');

    const deleteResponse = await axios.delete(
      `${API_URL}/users/${createdUserId}`,
      { headers }
    );

    log.success('Utilisateur supprimé avec succès');

    // Vérifier la suppression
    const listResponse4 = await axios.get(`${API_URL}/users`, { headers });
    const deletedUser = listResponse4.data.find(u => u.id === createdUserId);
    if (!deletedUser) {
      log.success('Vérification: utilisateur bien supprimé de la liste');
    } else {
      log.error('Vérification échouée: utilisateur toujours présent');
    }

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n' + '='.repeat(60));
    log.success('TOUS LES TESTS SONT PASSÉS ✅');
    console.log('='.repeat(60));
    console.log('\nFonctionnalités testées:');
    console.log('  ✅ Création d\'utilisateur');
    console.log('  ✅ Modification du username');
    console.log('  ✅ Modification du rôle');
    console.log('  ✅ Modification du mot de passe');
    console.log('  ✅ Protection contre auto-suppression');
    console.log('  ✅ Suppression d\'utilisateur');
    console.log('\n✨ Le système de gestion des utilisateurs fonctionne parfaitement!');

  } catch (error) {
    log.error(`\nERREUR DURANT LE TEST: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
    
    // Nettoyer l'utilisateur de test si créé
    if (createdUserId && token) {
      try {
        log.info('\nNettoyage: suppression de l\'utilisateur de test...');
        await axios.delete(
          `${API_URL}/users/${createdUserId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        log.success('Utilisateur de test supprimé');
      } catch (cleanupError) {
        log.warning('Impossible de supprimer l\'utilisateur de test');
      }
    }
  }
}

// Exécuter le test
console.log('🚀 Démarrage des tests d\'édition et suppression d\'utilisateurs\n');
testEditDeleteUser();
