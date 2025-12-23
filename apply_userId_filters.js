/**
 * Script pour ajouter automatiquement les filtres userId dans toutes les requêtes SQL
 * Ce script modifie server.js pour filtrer toutes les données par userId
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
// 1. MODIFIER LES SELECT * FROM table LIMIT
// ============================================================================
console.log('📝 Modification des SELECT avec LIMIT...');

const selectLimitPatterns = [
  {
    table: 'produits',
    old: `const [rows] = await pool.query('SELECT * FROM produits LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM produits WHERE userId = ? LIMIT 500', [userId]);`
  },
  {
    table: 'ventes',
    old: `const [rows] = await pool.query('SELECT * FROM ventes ORDER BY dateVente DESC LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC LIMIT 500', [userId]);`
  },
  {
    table: 'achats',
    old: `const [rows] = await pool.query('SELECT * FROM achats ORDER BY dateAchat DESC LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM achats WHERE userId = ? ORDER BY dateAchat DESC LIMIT 500', [userId]);`
  },
  {
    table: 'depenses',
    old: `const [rows] = await pool.query('SELECT * FROM depenses ORDER BY dateDepense DESC LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM depenses WHERE userId = ? ORDER BY dateDepense DESC LIMIT 500', [userId]);`
  },
  {
    table: 'clients',
    old: `const [rows] = await pool.query(\n      'SELECT * FROM clients ORDER BY nom ASC LIMIT 1000',\n    );`,
    new: `const [rows] = await pool.query(\n      'SELECT * FROM clients WHERE userId = ? ORDER BY nom ASC LIMIT 1000',\n      [userId]\n    );`
  },
  {
    table: 'fournisseurs',
    old: `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs ORDER BY nom ASC LIMIT 1000',\n    );`,
    new: `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE userId = ? ORDER BY nom ASC LIMIT 1000',\n      [userId]\n    );`
  },
  {
    table: 'retours_ventes',
    old: `const [rows] = await pool.query('SELECT * FROM retours_ventes ORDER BY dateRetour DESC LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);`
  },
  {
    table: 'retours_achats',
    old: `const [rows] = await pool.query('SELECT * FROM retours_achats ORDER BY dateRetour DESC LIMIT 500');`,
    new: `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);`
  },
  {
    table: 'lignes_vente',
    old: `const [rows] = await pool.query('SELECT * FROM lignes_vente ORDER BY id DESC LIMIT 1000');`,
    new: `const [rows] = await pool.query('SELECT * FROM lignes_vente WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);`
  },
  {
    table: 'lignes_achat',
    old: `const [rows] = await pool.query('SELECT * FROM lignes_achat ORDER BY id DESC LIMIT 1000');`,
    new: `const [rows] = await pool.query('SELECT * FROM lignes_achat WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);`
  }
];

selectLimitPatterns.forEach(pattern => {
  if (content.includes(pattern.old)) {
    content = content.replace(pattern.old, pattern.new);
    console.log(`  ✅ ${pattern.table}: SELECT avec LIMIT modifié`);
    modificationsCount++;
  }
});

// ============================================================================
// 2. MODIFIER LES SELECT * FROM table WHERE id = ? (GET by ID)
// ============================================================================
console.log('\n📝 Modification des SELECT WHERE id = ?...');

const selectByIdPatterns = [
  {
    table: 'produits',
    old: `const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'ventes',
    old: `const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'achats',
    old: `const [rows] = await pool.query('SELECT * FROM achats WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'depenses',
    old: `const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'clients',
    old: `const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`,
    new: `const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? AND userId = ?', [\n      req.params.id,\n      userId,\n    ]);`
  },
  {
    table: 'fournisseurs',
    old: `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`,
    new: `const [rows] = await pool.query(\n      'SELECT * FROM fournisseurs WHERE id = ? AND userId = ?',\n      [req.params.id, userId],\n    );`
  },
  {
    table: 'retours_ventes',
    old: `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'retours_achats',
    old: `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [req.params.id]);`,
    new: `const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  }
];

// Note: Les routes GET by ID n'ont pas authMiddleware, donc on doit l'ajouter d'abord
// Pour l'instant, on va juste modifier les requêtes et ajouter userId extraction

selectByIdPatterns.forEach(pattern => {
  if (content.includes(pattern.old)) {
    content = content.replace(pattern.old, pattern.new);
    console.log(`  ✅ ${pattern.table}: SELECT WHERE id = ? modifié`);
    modificationsCount++;
  }
});

// ============================================================================
// 3. AJOUTER authMiddleware et userId aux routes GET by ID
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
// 4. MODIFIER LES DELETE FROM table WHERE id = ?
// ============================================================================
console.log('\n📝 Modification des DELETE WHERE id = ?...');

const deletePatterns = [
  {
    table: 'produits',
    old: `const [result] = await pool.query('DELETE FROM produits WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'ventes',
    old: `const [result] = await pool.query('DELETE FROM ventes WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'achats',
    old: `const [result] = await pool.query('DELETE FROM achats WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'depenses',
    old: `const [result] = await pool.query('DELETE FROM depenses WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'clients',
    old: `const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [\n      req.params.id,\n    ]);`,
    new: `const [result] = await pool.query('DELETE FROM clients WHERE id = ? AND userId = ?', [\n      req.params.id,\n      userId,\n    ]);`
  },
  {
    table: 'fournisseurs',
    old: `const [result] = await pool.query(\n      'DELETE FROM fournisseurs WHERE id = ?',\n      [req.params.id],\n    );`,
    new: `const [result] = await pool.query(\n      'DELETE FROM fournisseurs WHERE id = ? AND userId = ?',\n      [req.params.id, userId],\n    );`
  },
  {
    table: 'retours_ventes',
    old: `const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  },
  {
    table: 'retours_achats',
    old: `const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ?', [req.params.id]);`,
    new: `const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);`
  }
];

deletePatterns.forEach(pattern => {
  if (content.includes(pattern.old)) {
    content = content.replace(pattern.old, pattern.new);
    console.log(`  ✅ ${pattern.table}: DELETE modifié`);
    modificationsCount++;
  }
});

// ============================================================================
// 5. MODIFIER LES UPDATE ... WHERE id = ?
// ============================================================================
console.log('\n📝 Modification des UPDATE WHERE id = ?...');

// Pour les UPDATE, on doit ajouter AND userId = ? à la fin de chaque WHERE id = ?
// C'est plus complexe car il y a plusieurs patterns

const updatePatterns = [
  {
    table: 'produits',
    old: `WHERE id = ?`,
    new: `WHERE id = ? AND userId = ?`,
    context: 'UPDATE produits SET'
  },
  {
    table: 'ventes',
    old: `WHERE id = ?`,
    new: `WHERE id = ? AND userId = ?`,
    context: 'UPDATE ventes SET'
  },
  {
    table: 'achats',
    old: `WHERE id = ?`,
    new: `WHERE id = ? AND userId = ?`,
    context: 'UPDATE achats SET'
  }
];

// Pour les UPDATE, on doit aussi ajouter userId au tableau de paramètres
// Chercher les patterns spécifiques

// UPDATE produits
const updateProduits = `WHERE id = ?`,
      [
        nom,
        categorieId,
        codebar,
        description,
        prixAchat,
        prixVente,
        prixGros,
        prixPromotion,
        quantite,
        seuilAlerte,
        imageBase64,
        now,
        dateExpiration,
        joursAlerteExpiration,
        now,
        req.params.id,
      ]`;

const updateProduitsNew = `WHERE id = ? AND userId = ?`,
      [
        nom,
        categorieId,
        codebar,
        description,
        prixAchat,
        prixVente,
        prixGros,
        prixPromotion,
        quantite,
        seuilAlerte,
        imageBase64,
        now,
        dateExpiration,
        joursAlerteExpiration,
        now,
        req.params.id,
        userId,
      ]`;

if (content.includes(updateProduits)) {
  content = content.replace(updateProduits, updateProduitsNew);
  console.log(`  ✅ produits: UPDATE modifié`);
  modificationsCount++;
}

// UPDATE ventes
const updateVentes = `WHERE id = ?`,
      [
        clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id,
      ]`;

const updateVentesNew = `WHERE id = ? AND userId = ?`,
      [
        clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ]`;

if (content.includes(updateVentes)) {
  content = content.replace(updateVentes, updateVentesNew);
  console.log(`  ✅ ventes: UPDATE modifié`);
  modificationsCount++;
}

// UPDATE achats
const updateAchats = `WHERE id = ?`,
      [
        fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id,
      ]`;

const updateAchatsNew = `WHERE id = ? AND userId = ?`,
      [
        fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ]`;

if (content.includes(updateAchats)) {
  content = content.replace(updateAchats, updateAchatsNew);
  console.log(`  ✅ achats: UPDATE modifié`);
  modificationsCount++;
}

// ============================================================================
// 6. MODIFIER LES INSERT pour utiliser userId du JWT au lieu de req.body
// ============================================================================
console.log('\n📝 Modification des INSERT pour utiliser userId du JWT...');

// POST produits - Remplacer userId = 1 par utilisation du JWT userId
const postProduitsOld = `const {
      nom,
      reference,
      prixAchat,
      prixVente,
      quantite = 0,
      marchandiseId = 1,
      userId = 1,`;

const postProduitsNew = `const {
      nom,
      reference,
      prixAchat,
      prixVente,
      quantite = 0,
      marchandiseId = 1,`;

if (content.includes(postProduitsOld)) {
  content = content.replace(postProduitsOld, postProduitsNew);
  console.log(`  ✅ produits: POST modifié pour utiliser userId du JWT`);
  modificationsCount++;
}

// POST clients - Ajouter userId dans INSERT
const postClientsInsert = `INSERT INTO clients
       (marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marchandiseId,`;

const postClientsInsertNew = `INSERT INTO clients
       (userId, marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        marchandiseId,`;

if (content.includes(postClientsInsert)) {
  content = content.replace(postClientsInsert, postClientsInsertNew);
  console.log(`  ✅ clients: POST modifié pour inclure userId`);
  modificationsCount++;
}

// POST fournisseurs - Ajouter userId dans INSERT
const postFournisseursInsert = `INSERT INTO fournisseurs
       (marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marchandiseId,`;

const postFournisseursInsertNew = `INSERT INTO fournisseurs
       (userId, marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        marchandiseId,`;

if (content.includes(postFournisseursInsert)) {
  content = content.replace(postFournisseursInsert, postFournisseursInsertNew);
  console.log(`  ✅ fournisseurs: POST modifié pour inclure userId`);
  modificationsCount++;
}

// POST ventes - Ajouter userId dans INSERT
const postVentesInsert = `INSERT INTO ventes
       (marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [marchandiseId, clientId,`;

const postVentesInsertNew = `INSERT INTO ventes
       (userId, marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, clientId,`;

if (content.includes(postVentesInsert)) {
  content = content.replace(postVentesInsert, postVentesInsertNew);
  console.log(`  ✅ ventes: POST modifié pour inclure userId`);
  modificationsCount++;
}

// POST achats - Ajouter userId dans INSERT
const postAchatsInsert = `INSERT INTO achats
       (marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [marchandiseId, fournisseurId,`;

const postAchatsInsertNew = `INSERT INTO achats
       (userId, marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, fournisseurId,`;

if (content.includes(postAchatsInsert)) {
  content = content.replace(postAchatsInsert, postAchatsInsertNew);
  console.log(`  ✅ achats: POST modifié pour inclure userId`);
  modificationsCount++;
}

// POST depenses - Ajouter userId dans INSERT
const postDepensesInsert = `INSERT INTO depenses
       (marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marchandiseId, libelle,`;

const postDepensesInsertNew = `INSERT INTO depenses
       (userId, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, marchandiseId, libelle,`;

if (content.includes(postDepensesInsert)) {
  content = content.replace(postDepensesInsert, postDepensesInsertNew);
  console.log(`  ✅ depenses: POST modifié pour inclure userId`);
  modificationsCount++;
}

// ============================================================================
// 7. SAUVEGARDER LE FICHIER MODIFIÉ
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
