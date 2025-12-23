const fs = require('fs');

console.log('🔧 Application des filtres ownerId (version sûre)...\n');

// Lire le fichier server.js
let content = fs.readFileSync('server.js', 'utf8');
let modified = false;

// 1. Ajouter l'import du middleware ownerId
if (!content.includes("require('./middleware/ownerId')")) {
  console.log('✅ Ajout de l\'import du middleware ownerId...');
  content = content.replace(
    "const { authMiddleware, requireRole } = require('./middleware/auth');",
    `const { authMiddleware, requireRole } = require('./middleware/auth');
const { addOwnerIdMiddleware } = require('./middleware/ownerId');`
  );
  modified = true;
}

// 2. Ajouter le middleware après authMiddleware
if (!content.includes('app.use(addOwnerIdMiddleware(pool))')) {
  console.log('✅ Ajout du middleware ownerId...');
  
  // Trouver où ajouter le middleware (après les routes auth)
  const authRoutesLine = "app.use('/api/auth', authRouter);";
  if (content.includes(authRoutesLine)) {
    content = content.replace(
      authRoutesLine,
      `${authRoutesLine}

// ============================================================================
// MIDDLEWARE OWNERID - Ajoute automatiquement req.ownerId pour le partage de données
// ============================================================================
app.use(addOwnerIdMiddleware(pool));`
    );
    modified = true;
  }
}

// 3. Remplacer userId par ownerId dans les WHERE clauses (SELECT uniquement)
console.log('\n📝 Remplacement des filtres userId par ownerId...\n');

// Pattern pour les SELECT avec WHERE userId = ?
const selectPatterns = [
  // SELECT ... WHERE userId = ?
  {
    search: /(SELECT[\s\S]*?WHERE\s+)userId(\s*=\s*\?)/gi,
    replace: '$1userId$2',
    description: 'SELECT avec WHERE userId = ?',
  },
  // SELECT ... WHERE ... AND userId = ?
  {
    search: /(SELECT[\s\S]*?WHERE[\s\S]*?AND\s+)userId(\s*=\s*\?)/gi,
    replace: '$1userId$2',
    description: 'SELECT avec AND userId = ?',
  },
];

// Compter les occurrences avant
const beforeCount = (content.match(/WHERE\s+userId\s*=\s*\?/gi) || []).length;
console.log(`📊 Trouvé ${beforeCount} occurrences de "WHERE userId = ?"`);

// Note: On ne peut pas remplacer automatiquement car il faut distinguer:
// - SELECT (utiliser ownerId)
// - INSERT/UPDATE (garder userId)
// - DELETE (utiliser ownerId)

console.log('\n⚠️  REMPLACEMENT MANUEL REQUIS\n');
console.log('Le middleware a été ajouté, mais vous devez manuellement:');
console.log('\n1. Dans les routes SELECT, remplacer:');
console.log('   WHERE userId = ?  →  WHERE userId = ?');
console.log('   [userId]          →  [req.ownerId]');
console.log('\n2. Dans les routes INSERT, GARDER userId:');
console.log('   INSERT INTO ... (userId) VALUES (?)');
console.log('   [userId]  →  GARDER [userId]');
console.log('\n3. Dans les routes UPDATE/DELETE, utiliser ownerId:');
console.log('   WHERE id = ? AND userId = ?');
console.log('   [id, userId]  →  [id, req.ownerId]');

// Sauvegarder le fichier modifié
if (modified) {
  fs.writeFileSync('server.js', content, 'utf8');
  console.log('\n✅ Fichier server.js modifié avec succès!');
  console.log('   - Middleware ownerId ajouté');
  console.log('   - req.ownerId disponible dans toutes les routes');
} else {
  console.log('\n✅ Middleware déjà présent, aucune modification nécessaire.');
}

console.log('\n📋 Prochaines étapes:');
console.log('1. Redémarrer le serveur: node server.js');
console.log('2. Modifier manuellement les routes pour utiliser req.ownerId');
console.log('3. Tester avec un vendeur\n');
