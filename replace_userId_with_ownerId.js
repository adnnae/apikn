const fs = require('fs');

console.log('🔧 Remplacement automatique userId → ownerId dans les SELECT...\n');

// Lire le fichier server.js
let content = fs.readFileSync('server.js', 'utf8');

// Compter les modifications
let modifications = 0;

// Liste des routes à modifier (GET uniquement)
const routesToModify = [
  '/api/produits',
  '/api/clients',
  '/api/fournisseurs',
  '/api/ventes',
  '/api/achats',
  '/api/lignes_vente',
  '/api/lignes_achat',
  '/api/devis',
  '/api/factures',
  '/api/reglements',
  '/api/depenses',
  '/api/categories',
  '/api/retours',
  '/api/stock',
];

// Pattern pour remplacer dans les routes GET
// On cherche: const userId = req.userId; suivi d'une requête SELECT avec WHERE userId = ?
const pattern = /(app\.get\(['"]\/api\/[^'"]+['"],\s*authMiddleware[^{]*\{[^}]*const userId = req\.userId;)/g;

// Fonction pour remplacer userId par ownerId dans une route GET
function replaceInGetRoute(match) {
  // Vérifier si c'est une route GET avec SELECT
  if (match.includes('SELECT') && match.includes('WHERE') && match.includes('userId')) {
    // Ajouter const ownerId = req.ownerId après const userId = req.userId
    if (!match.includes('const ownerId = req.ownerId')) {
      modifications++;
      return match.replace(
        'const userId = req.userId;',
        'const userId = req.userId;\n  const ownerId = req.ownerId; // ✅ Utiliser ownerId pour partager les données'
      );
    }
  }
  return match;
}

// Appliquer les remplacements
content = content.replace(pattern, replaceInGetRoute);

// Maintenant remplacer [userId] par [ownerId] dans les SELECT
// Pattern plus spécifique: SELECT ... WHERE userId = ? ... [userId]
const selectPattern = /(SELECT[\s\S]*?WHERE[\s\S]*?userId\s*=\s*\?[\s\S]*?\[)userId(\])/gi;

let selectMatches = 0;
content = content.replace(selectPattern, (match, p1, p2) => {
  // Vérifier que c'est bien dans un SELECT et pas un INSERT
  if (match.includes('SELECT') && !match.includes('INSERT')) {
    selectMatches++;
    return `${p1}ownerId${p2}`;
  }
  return match;
});

console.log(`✅ ${modifications} routes modifiées (ajout de ownerId)`);
console.log(`✅ ${selectMatches} paramètres [userId] remplacés par [ownerId] dans les SELECT`);

// Sauvegarder
fs.writeFileSync('server.js', content, 'utf8');

console.log('\n✅ Modifications appliquées!');
console.log('\n📋 Vérifiez manuellement:');
console.log('   - Les routes GET utilisent bien [ownerId]');
console.log('   - Les routes POST/PUT gardent [userId] pour l\'insertion');
console.log('\n🚀 Redémarrez le serveur: node server.js\n');
