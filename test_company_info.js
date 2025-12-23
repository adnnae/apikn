// ============================================================================
// TEST: Informations de société
// ============================================================================
// Ce script teste les routes company-info et diagnostique les problèmes
// ============================================================================

require('dotenv').config();
const axios = require('axios');
const { pool } = require('./db');

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

async function testCompanyInfo() {
  try {
    // ========================================
    // ÉTAPE 1: Vérifier la structure de la table
    // ========================================
    log.step('ÉTAPE 1: Vérifier la structure de la table users');
    
    const [columns] = await pool.query('DESCRIBE users');
    
    const requiredColumns = [
      'nomSociete', 'raisonSociale', 'telephone', 'telephone2', 'fixe', 'fax',
      'ville', 'adresseComplete', 'ice', 'rc', 'if_', 'cnss',
      'banque', 'codeBanque', 'compteBanque', 'activite', 'texte',
      'logoBase64', 'signatureCachetBase64',
      'devise', 'langue', 'configurationTerminee'
    ];
    
    const existingColumns = columns.map(col => col.Field);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      log.error(`Colonnes manquantes dans la table users:`);
      missingColumns.forEach(col => console.log(`   - ${col}`));
      log.warning('\nVous devez exécuter le script SQL:');
      console.log('   mysql -u root -p knachsoft < sql/add_company_info_to_users.sql');
      return;
    } else {
      log.success('Toutes les colonnes nécessaires existent');
    }

    // ========================================
    // ÉTAPE 2: Vérifier les données de l'utilisateur admin
    // ========================================
    log.step('\nÉTAPE 2: Vérifier les données de l\'utilisateur admin');
    
    const [users] = await pool.query('SELECT id, username, nomSociete, logoBase64 FROM users WHERE id = 1');
    
    if (users.length === 0) {
      log.error('Utilisateur admin (id=1) non trouvé');
      return;
    }
    
    const admin = users[0];
    log.success(`Utilisateur trouvé: ${admin.username} (id=${admin.id})`);
    console.log(`   nomSociete: ${admin.nomSociete || '(vide)'}`);
    console.log(`   logoBase64: ${admin.logoBase64 ? 'Présent' : '(vide)'}`);

    // ========================================
    // ÉTAPE 3: Connexion et test de la route GET
    // ========================================
    log.step('\nÉTAPE 3: Test de la route GET /api/users/company-info');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    });

    const token = loginResponse.data.token;
    log.success('Admin connecté - Token obtenu');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const getResponse = await axios.get(`${API_URL}/users/company-info`, { headers });
      log.success('Route GET fonctionne!');
      console.log('   Données reçues:');
      console.log(`   - nomSociete: ${getResponse.data.nomSociete || '(vide)'}`);
      console.log(`   - ville: ${getResponse.data.ville || '(vide)'}`);
      console.log(`   - ice: ${getResponse.data.ice || '(vide)'}`);
      console.log(`   - logoBase64: ${getResponse.data.logoBase64 ? 'Présent' : '(vide)'}`);
    } catch (error) {
      if (error.response) {
        log.error(`Route GET échoue: ${error.response.status}`);
        console.log('   Réponse:', error.response.data);
      } else {
        log.error(`Erreur réseau: ${error.message}`);
      }
      return;
    }

    // ========================================
    // ÉTAPE 4: Test de la route PUT
    // ========================================
    log.step('\nÉTAPE 4: Test de la route PUT /api/users/company-info');
    
    try {
      const putResponse = await axios.put(
        `${API_URL}/users/company-info`,
        {
          nomSociete: 'Test Société',
          ville: 'Casablanca',
          telephone: '0612345678',
          ice: '123456789',
        },
        { headers }
      );
      log.success('Route PUT fonctionne!');
      console.log('   Message:', putResponse.data.message);
    } catch (error) {
      if (error.response) {
        log.error(`Route PUT échoue: ${error.response.status}`);
        console.log('   Réponse:', error.response.data);
      } else {
        log.error(`Erreur réseau: ${error.message}`);
      }
      return;
    }

    // ========================================
    // ÉTAPE 5: Vérifier que les données ont été sauvegardées
    // ========================================
    log.step('\nÉTAPE 5: Vérifier la sauvegarde dans MySQL');
    
    const [updatedUsers] = await pool.query(
      'SELECT nomSociete, ville, telephone, ice FROM users WHERE id = 1'
    );
    
    const updated = updatedUsers[0];
    log.success('Données sauvegardées:');
    console.log(`   - nomSociete: ${updated.nomSociete}`);
    console.log(`   - ville: ${updated.ville}`);
    console.log(`   - telephone: ${updated.telephone}`);
    console.log(`   - ice: ${updated.ice}`);

    // ========================================
    // RÉSUMÉ
    // ========================================
    console.log('\n' + '='.repeat(60));
    log.success('TOUS LES TESTS SONT PASSÉS ✅');
    console.log('='.repeat(60));
    console.log('\nLes routes company-info fonctionnent correctement!');

  } catch (error) {
    log.error(`\nERREUR DURANT LE TEST: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Exécuter le test
console.log('🚀 Démarrage du diagnostic company-info\n');
testCompanyInfo();
