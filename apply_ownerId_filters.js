const fs = require('fs');

console.log('🔧 Application des filtres ownerId...\n');

// Lire le fichier server.js
let content = fs.readFileSync('server.js', 'utf8');

// Fonction pour ajouter la récupération de ownerId après req.userId
const addOwnerIdLogic = `
  // ✅ Récupérer l'ownerId de l'utilisateur connecté pour filtrer les données partagées
  let ownerIdFilter = userId;
  try {
    const [currentUser] = await pool.query('SELECT ownerId FROM users WHERE id = ?', [userId]);
    if (currentUser.length > 0 && currentUser[0].ownerId) {
      ownerIdFilter = currentUser[0].ownerId;
    }
  } catch (err) {
    console.error('Erreur récupération ownerId:', err);
  }
`;

// Patterns à remplacer
const patterns = [
  // Pattern 1: const userId = req.userId; suivi directement d'une requête
  {
    search: /(const userId = req\.userId;[^\n]*\n)([\s]*)(const \[|try \{|await pool\.query)/g,
    replace: `$1$2${addOwnerIdLogic.trim()}\n$2$3`,
  },
  
  // Pattern 2: Remplacer WHERE userId = ? par WHERE userId = ?
  // On va créer un script plus intelligent
];

// Compter les occurrences
const userIdCount = (content.match(/const userId = req\.userId/g) || []).length;
console.log(`📊 Trouvé ${userIdCount} occurrences de "const userId = req.userId"`);

console.log('\n⚠️  ATTENTION: Ce script est complexe.');
console.log('   Il est recommandé de modifier manuellement les routes.');
console.log('\n📝 Voici ce qu\'il faut faire dans chaque route:\n');

console.log(`
1. Après "const userId = req.userId;", ajouter:

   ${addOwnerIdLogic}

2. Remplacer tous les filtres:
   - WHERE userId = ?          →  WHERE userId = ?  (garder userId pour l'insertion)
   - WHERE id = ? AND userId = ? →  WHERE id = ? AND userId = ?
   
   MAIS pour les SELECT, utiliser ownerIdFilter:
   - SELECT * FROM ventes WHERE userId = ?  →  SELECT * FROM ventes WHERE userId = ?
   
3. Pour les INSERT, garder userId (l'utilisateur qui crée):
   - INSERT INTO ventes (..., userId) VALUES (..., ?)  →  Garder userId

`);

console.log('❌ Script automatique trop risqué.');
console.log('✅ Utilisez plutôt le script apply_ownerId_filters_safe.js\n');
