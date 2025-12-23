require('dotenv').config();
const { pool } = require('./db');

async function testReturns() {
  try {
    console.log('🔍 Test de la synchronisation des retours MySQL...\n');
    
    // 1. Vérifier si les tables existent
    console.log('1️⃣ Vérification des tables...');
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('retours_ventes', 'retours_achats', 'lignes_retour_vente', 'lignes_retour_achat')
    `, [process.env.DB_NAME || 'default_db']);
    
    console.log('   Tables trouvées:', tables.map(t => t.TABLE_NAME).join(', '));
    
    if (tables.length === 0) {
      console.log('   ❌ AUCUNE table de retours trouvée!');
      console.log('   💡 Exécutez create_tables_retours.js pour créer les tables');
      process.exit(1);
    }
    
    // 2. Compter les retours de vente
    console.log('\n2️⃣ Comptage des retours de vente...');
    const [venteCount] = await pool.query('SELECT COUNT(*) as count FROM retours_ventes');
    console.log(`   Total retours de vente: ${venteCount[0].count}`);
    
    if (venteCount[0].count > 0) {
      const [samples] = await pool.query('SELECT * FROM retours_ventes LIMIT 3');
      console.log('   Exemples:');
      samples.forEach(r => {
        console.log(`     - ID: ${r.id}, Vente: ${r.venteId}, Montant: ${r.montantTotal}, Date: ${r.dateRetour}`);
      });
    }
    
    // 3. Compter les retours d'achat
    console.log('\n3️⃣ Comptage des retours d\'achat...');
    const [achatCount] = await pool.query('SELECT COUNT(*) as count FROM retours_achats');
    console.log(`   Total retours d'achat: ${achatCount[0].count}`);
    
    if (achatCount[0].count > 0) {
      const [samples] = await pool.query('SELECT * FROM retours_achats LIMIT 3');
      console.log('   Exemples:');
      samples.forEach(r => {
        console.log(`     - ID: ${r.id}, Achat: ${r.achatId}, Montant: ${r.montantTotal}, Date: ${r.dateRetour}`);
      });
    }
    
    // 4. Tester l'API
    console.log('\n4️⃣ Test de l\'API...');
    const http = require('http');
    
    const testEndpoint = (path) => {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:4000${path}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({ status: res.statusCode, data: json });
            } catch (e) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        }).on('error', reject);
      });
    };
    
    try {
      const venteResult = await testEndpoint('/api/retours_ventes');
      console.log(`   GET /api/retours_ventes: ${venteResult.status} - ${Array.isArray(venteResult.data) ? venteResult.data.length : 0} retours`);
      
      const achatResult = await testEndpoint('/api/retours_achats');
      console.log(`   GET /api/retours_achats: ${achatResult.status} - ${Array.isArray(achatResult.data) ? achatResult.data.length : 0} retours`);
    } catch (e) {
      console.log(`   ⚠️ Serveur API non accessible: ${e.message}`);
      console.log(`   💡 Assurez-vous que le serveur tourne sur http://localhost:4000`);
    }
    
    // 5. Résumé
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   ✅ Tables créées: ${tables.length}/4`);
    console.log(`   📦 Retours de vente dans MySQL: ${venteCount[0].count}`);
    console.log(`   📦 Retours d'achat dans MySQL: ${achatCount[0].count}`);
    
    if (venteCount[0].count === 0 && achatCount[0].count === 0) {
      console.log('\n⚠️ DIAGNOSTIC:');
      console.log('   Les tables existent mais sont VIDES.');
      console.log('   Cela signifie que:');
      console.log('   1. Les retours créés dans l\'app mobile ne sont PAS synchronisés (PUSH)');
      console.log('   2. OU aucun retour n\'a encore été créé dans l\'app mobile');
      console.log('\n💡 SOLUTION:');
      console.log('   1. Créez un retour de vente dans l\'app mobile');
      console.log('   2. Vérifiez les logs de sync: "📤 [API SYNC]"');
      console.log('   3. Relancez ce script pour vérifier');
    } else {
      console.log('\n✅ Les retours sont présents dans MySQL!');
      console.log('   Si l\'app mobile affiche "Total retours: 0", le problème est dans le PULL.');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testReturns();
