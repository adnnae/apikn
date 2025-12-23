/**
 * Script pour ajouter automatiquement les filtres userId dans toutes les requêtes SQL
 * Version 2 - Plus robuste
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Application des filtres userId dans server.js...\n');

// Lire le fichier server.js
let content = fs.readFileSync(serverPath, 'utf8');

// Créer une sauvegarde
const backupPath = path.join(__dirname, 'server.js.before_userId_filters');
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Sauvegarde créée: ${backupPath}\n`);

let modificationsCount = 0;

// ============================================================================
// 1. MODIFIER LES SELECT * FROM table LIMIT - Ajouter WHERE userId = ?
// ============================================================================
console.log('📝 Modification des SELECT avec LIMIT...');

// Produits
if (content.includes(`const [rows] = await pool.query('SELECT * FROM produits LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM produits LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM produits WHERE userId = ? LIMIT 500', [userId]);`
  );
  console.log(`  ✅ produits: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Ventes
if (content.includes(`const [rows] = await pool.query('SELECT * FROM ventes ORDER BY dateVente DESC LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM ventes ORDER BY dateVente DESC LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC LIMIT 500', [userId]);`
  );
  console.log(`  ✅ ventes: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Achats
if (content.includes(`const [rows] = await pool.query('SELECT * FROM achats ORDER BY dateAchat DESC LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM achats ORDER BY dateAchat DESC LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM achats WHERE userId = ? ORDER BY dateAchat DESC LIMIT 500', [userId]);`
  );
  console.log(`  ✅ achats: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Depenses
if (content.includes(`const [rows] = await pool.query('SELECT * FROM depenses ORDER BY dateDepense DESC LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM depenses ORDER BY dateDepense DESC LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM depenses WHERE userId = ? ORDER BY dateDepense DESC LIMIT 500', [userId]);`
  );
  console.log(`  ✅ depenses: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Clients
if (content.includes(`const [rows] = await pool.query(\n      'SELECT * FROM clients ORDER BY nom ASC LIMIT 1000',\n    );`)) {
  content = content.replace(
    `const [rows] = await pool.query(\n      'SELECT * FROM clients ORDER BY nom ASC LIMIT 1000',\n    );`,
    `const [rows] = await pool.query(\n      'SELECT * FROM clients WHERE userId = ? ORDER BY nom ASC LIMIT 1000',\n      [userId]\n    );`
  );
  console.log(`  ✅ clients: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Fournisseurs
if (content.includes(`const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs ORDER BY nom ASC LIMIT 1000',\n    );`)) {
  content = content.replace(
    `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs ORDER BY nom ASC LIMIT 1000',\n    );`,
    `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE userId = ? ORDER BY nom ASC LIMIT 1000',\n      [userId]\n    );`
  );
  console.log(`  ✅ fournisseurs: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Retours ventes
if (content.includes(`const [rows] = await pool.query('SELECT * FROM retours_ventes ORDER BY dateRetour DESC LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM retours_ventes ORDER BY dateRetour DESC LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);`
  );
  console.log(`  ✅ retours_ventes: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Retours achats
if (content.includes(`const [rows] = await pool.query('SELECT * FROM retours_achats ORDER BY dateRetour DESC LIMIT 500');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM retours_achats ORDER BY dateRetour DESC LIMIT 500');`,
    `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);`
  );
  console.log(`  ✅ retours_achats: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Lignes vente
if (content.includes(`const [rows] = await pool.query('SELECT * FROM lignes_vente ORDER BY id DESC LIMIT 1000');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM lignes_vente ORDER BY id DESC LIMIT 1000');`,
    `const [rows] = await pool.query('SELECT * FROM lignes_vente WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);`
  );
  console.log(`  ✅ lignes_vente: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// Lignes achat
if (content.includes(`const [rows] = await pool.query('SELECT * FROM lignes_achat ORDER BY id DESC LIMIT 1000');`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM lignes_achat ORDER BY id DESC LIMIT 1000');`,
    `const [rows] = await pool.query('SELECT * FROM lignes_achat WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);`
  );
  console.log(`  ✅ lignes_achat: SELECT avec LIMIT modifié`);
  modificationsCount++;
}

// ============================================================================
// 2. AJOUTER authMiddleware et userId aux routes GET by ID
// ============================================================================
console.log('\n📝 Ajout de authMiddleware aux routes GET by ID...');

const getByIdRoutes = [
  { path: '/api/produits/:id', table: 'produits' },
  { path: '/api/ventes/:id', table: 'ventes' },
  { path: '/api/achats/:id', table: 'achats' },
  { path: '/api/depenses/:id', table: 'depenses' },
  { path: '/api/clients/:id', table: 'clients' },
  { path: '/api/fournisseurs/:id', table: 'fournisseurs' },
  { path: '/api/retours_ventes/:id', table: 'retours_ventes' },
  { path: '/api/retours_achats/:id', table: 'retours_achats' }
];

getByIdRoutes.forEach(route => {
  const oldPattern = `app.get('${route.path}', async (req, res) => {`;
  const newPattern = `app.get('${route.path}', authMiddleware, async (req, res) => {\n  const userId = req.userId; // ✅ Extrait du JWT`;
  
  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    console.log(`  ✅ ${route.table}: authMiddleware ajouté à GET by ID`);
    modificationsCount++;
  }
});

// ============================================================================
// 3. MODIFIER LES SELECT * FROM table WHERE id = ? (GET by ID)
// ============================================================================
console.log('\n📝 Modification des SELECT WHERE id = ?...');

// Produits
if (content.includes(`const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ produits: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Ventes
if (content.includes(`const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ ventes: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Achats
if (content.includes(`const [rows] = await pool.query('SELECT * FROM achats WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM achats WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ achats: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Depenses
if (content.includes(`const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ depenses: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Clients
if (content.includes(`const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`,
    `const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? AND userId = ?', [\n      req.params.id,\n      userId,\n    ]);`
  );
  console.log(`  ✅ clients: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Fournisseurs
if (content.includes(`const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`)) {
  content = content.replace(
    `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`,
    `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE id = ? AND userId = ?',\n      [req.params.id, userId],\n    );`
  );
  console.log(`  ✅ fournisseurs: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Retours ventes
if (content.includes(`const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ retours_ventes: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// Retours achats
if (content.includes(`const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [req.params.id]);`,
    `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ retours_achats: SELECT WHERE id = ? modifié`);
  modificationsCount++;
}

// ============================================================================
// 4. MODIFIER LES DELETE FROM table WHERE id = ?
// ============================================================================
console.log('\n📝 Modification des DELETE WHERE id = ?...');

// Produits
if (content.includes(`const [result] = await pool.query('DELETE FROM produits WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM produits WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ produits: DELETE modifié`);
  modificationsCount++;
}

// Ventes
if (content.includes(`const [result] = await pool.query('DELETE FROM ventes WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM ventes WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ ventes: DELETE modifié`);
  modificationsCount++;
}

// Achats
if (content.includes(`const [result] = await pool.query('DELETE FROM achats WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM achats WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ achats: DELETE modifié`);
  modificationsCount++;
}

// Depenses
if (content.includes(`const [result] = await pool.query('DELETE FROM depenses WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM depenses WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ depenses: DELETE modifié`);
  modificationsCount++;
}

// Clients
if (content.includes(`const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`,
    `const [result] = await pool.query('DELETE FROM clients WHERE id = ? AND userId = ?', [\n      req.params.id,\n      userId,\n    ]);`
  );
  console.log(`  ✅ clients: DELETE modifié`);
  modificationsCount++;
}

// Fournisseurs
if (content.includes(`const [result] = await pool.query(\n      'DELETE FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`)) {
  content = content.replace(
    `const [result] = await pool.query(\n      'DELETE FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`,
    `const [result] = await pool.query(\n      'DELETE FROM fournisseurs WHERE id = ? AND userId = ?',\n      [req.params.id, userId],\n    );`
  );
  console.log(`  ✅ fournisseurs: DELETE modifié`);
  modificationsCount++;
}

// Retours ventes
if (content.includes(`const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ retours_ventes: DELETE modifié`);
  modificationsCount++;
}

// Retours achats
if (content.includes(`const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ?', [req.params.id]);`)) {
  content = content.replace(
    `const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ?', [req.params.id]);`,
    `const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  );
  console.log(`  ✅ retours_achats: DELETE modifié`);
  modificationsCount++;
}

// ============================================================================
// 5. SAUVEGARDER LE FICHIER MODIFIÉ
// ============================================================================
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\n✅ Modifications terminées!`);
console.log(`📊 Total de modifications: ${modificationsCount}`);
console.log(`📁 Fichier modifié: ${serverPath}`);
console.log(`💾 Sauvegarde: ${backupPath}`);
console.log(`\n🎯 Prochaines étapes:`);
console.log(`   1. Redémarrer le serveur: node server.js`);
console.log(`   2. Tester l'authentification: node test_auth.js`);
console.log(`   3. Vérifier que les données sont filtrées par userId`);
console.log(`\n⚠️  NOTE: Les INSERT et UPDATE nécessitent des modifications manuelles`);
console.log(`   car ils ont des structures complexes. Voir INTEGRATION_JWT_SERVER.md`);
