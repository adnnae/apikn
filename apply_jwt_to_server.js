// ============================================================================
// Script: Appliquer JWT à server.js automatiquement
// ============================================================================
// Usage: node apply_jwt_to_server.js
// ============================================================================

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
const backupPath = path.join(__dirname, 'server.js.backup');

console.log('[INFO] Lecture de server.js...');

// Lire le fichier server.js
let content = fs.readFileSync(serverPath, 'utf8');

// Créer une sauvegarde
console.log('[INFO] Creation d\'une sauvegarde (server.js.backup)...');
fs.writeFileSync(backupPath, content, 'utf8');

// ============================================================================
// ÉTAPE 1: Ajouter les imports JWT
// ============================================================================
console.log('\n[ETAPE 1] Ajout des imports JWT...');

const importsToAdd = `
// ============================================================================
// IMPORTS JWT - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
const { router: authRouter, initPool: initAuthPool } = require('./routes/auth');
const { authMiddleware, requireRole } = require('./middleware/auth');
`;

// Ajouter après les imports existants (après require('./db'))
if (!content.includes('require(\'./routes/auth\')')) {
  content = content.replace(
    /const { pool, testConnection } = require\('\.\/db'\);/,
    `const { pool, testConnection } = require('./db');${importsToAdd}`
  );
  console.log('[OK] Imports JWT ajoutes');
} else {
  console.log('[WARN] Imports JWT deja presents');
}

// ============================================================================
// ÉTAPE 2: Initialiser le pool pour auth
// ============================================================================
console.log('\n[ETAPE 2] Initialisation du pool pour auth...');

const initPoolCode = `
// ============================================================================
// INITIALISER LE POOL POUR LES ROUTES AUTH - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
initAuthPool(pool);
`;

// Ajouter après app.use(express.urlencoded(...))
if (!content.includes('initAuthPool(pool)')) {
  content = content.replace(
    /app\.use\(express\.urlencoded\([^)]+\)\);/,
    `app.use(express.urlencoded({ limit: '50mb', extended: true }));${initPoolCode}`
  );
  console.log('[OK] Initialisation du pool ajoutee');
} else {
  console.log('[WARN] Initialisation du pool deja presente');
}

// ============================================================================
// ÉTAPE 3: Ajouter les routes auth (NON PROTÉGÉES)
// ============================================================================
console.log('\n[ETAPE 3] Ajout des routes auth...');

const authRoutesCode = `
// ============================================================================
// ROUTES D'AUTHENTIFICATION (NON PROTÉGÉES) - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
app.use('/api/auth', authRouter);

// ============================================================================
// TOUTES LES ROUTES CI-DESSOUS SONT MAINTENANT PROTÉGÉES PAR JWT
// ============================================================================
`;

// Ajouter après le health check
if (!content.includes('app.use(\'/api/auth\'')) {
  content = content.replace(
    /(app\.get\('\/api\/health'[^}]+}\);)/,
    `$1${authRoutesCode}`
  );
  console.log('[OK] Routes auth ajoutees');
} else {
  console.log('[WARN] Routes auth deja presentes');
}

// ============================================================================
// ÉTAPE 4: Protéger toutes les routes
// ============================================================================
console.log('\n[ETAPE 4] Protection des routes avec authMiddleware...');

let routesProtected = 0;

// Pattern pour trouver les routes à protéger
const routePatterns = [
  // GET routes
  /app\.get\('\/api\/(produits|ventes|achats|clients|fournisseurs|depenses|categories|lignes_vente|lignes_achat|lignes_retour_vente|lignes_retour_achat|retours_ventes|retours_achats|reglements_clients|reglements_fournisseurs|historique_reglements_clients|historique_reglements_fournisseurs|sync_metadata)',\s*async/g,
  // POST routes
  /app\.post\('\/api\/(produits|ventes|achats|clients|fournisseurs|depenses|categories|lignes_vente|lignes_achat|lignes_retour_vente|lignes_retour_achat|retours_ventes|retours_achats|reglements_clients|reglements_fournisseurs|sync_metadata)',\s*async/g,
  // PUT routes
  /app\.put\('\/api\/(produits|ventes|achats|clients|fournisseurs|depenses|categories|lignes_vente|lignes_achat|lignes_retour_vente|lignes_retour_achat|retours_ventes|retours_achats|reglements_clients|reglements_fournisseurs|sync_metadata)\/:\w+',\s*async/g,
  // DELETE routes
  /app\.delete\('\/api\/(produits|ventes|achats|clients|fournisseurs|depenses|categories|lignes_vente|lignes_achat|lignes_retour_vente|lignes_retour_achat|retours_ventes|retours_achats|reglements_clients|reglements_fournisseurs|sync_metadata)\/:\w+',\s*async/g,
];

routePatterns.forEach(pattern => {
  content = content.replace(pattern, (match) => {
    if (!match.includes('authMiddleware')) {
      routesProtected++;
      return match.replace(', async', ', authMiddleware, async');
    }
    return match;
  });
});

console.log(`[OK] ${routesProtected} routes protegees avec authMiddleware`);

// ============================================================================
// ÉTAPE 5: Ajouter userId dans les routes
// ============================================================================
console.log('\n[ETAPE 5] Ajout de userId dans les routes...');

// Ajouter const userId = req.userId; au début de chaque route protégée
const addUserIdExtraction = (content) => {
  // Pattern pour trouver les fonctions async après authMiddleware
  const pattern = /(authMiddleware,\s*async\s*\(req,\s*res\)\s*=>\s*{)/g;
  
  return content.replace(pattern, (match) => {
    return `${match}\n  const userId = req.userId; // ✅ Extrait du JWT`;
  });
};

content = addUserIdExtraction(content);
console.log('[OK] Extraction de userId ajoutee');

// ============================================================================
// SAUVEGARDER LE FICHIER MODIFIÉ
// ============================================================================
console.log('\n[INFO] Sauvegarde du fichier modifie...');
fs.writeFileSync(serverPath, content, 'utf8');

console.log('\n========================================================');
console.log('  MODIFICATIONS APPLIQUEES AVEC SUCCES!');
console.log('========================================================');

console.log('\nResume des modifications:');
console.log(`   [OK] Imports JWT ajoutes`);
console.log(`   [OK] Pool initialise pour auth`);
console.log(`   [OK] Routes auth ajoutees (/api/auth/*)`);
console.log(`   [OK] ${routesProtected} routes protegees avec authMiddleware`);
console.log(`   [OK] Extraction de userId ajoutee`);

console.log('\n[IMPORTANT] Actions manuelles requises:');
console.log('   1. Verifier que toutes les requetes SQL filtrent par userId');
console.log('   2. Ajouter userId dans les INSERT (remplacer req.body.userId par userId)');
console.log('   3. Ajouter AND userId = ? dans les UPDATE/DELETE');
console.log('   4. Tester avec: node test_auth.js');

console.log('\n[INFO] Sauvegarde creee: server.js.backup');
console.log('   Pour restaurer: copy server.js.backup server.js');

console.log('\nProchaines etapes:');
console.log('   1. Reviser server.js pour les modifications SQL');
console.log('   2. Redemarrer le serveur: node server.js');
console.log('   3. Tester: node test_auth.js');
console.log('   4. Verifier les logs du serveur\n');
