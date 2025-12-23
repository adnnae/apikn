# ✅ Configuration userId - Résumé Complet

## 📊 État Actuel

### ✅ Réussi:
1. **Table `users` créée** avec succès
2. **Utilisateur admin créé** (id=1)
3. **14 tables ont la colonne `userId`:**
   - achats
   - categories
   - clients
   - depenses
   - fournisseurs
   - lignes_achat
   - lignes_retour_achat
   - lignes_retour_vente
   - lignes_vente
   - produits
   - retours_achats
   - retours_ventes
   - sync_metadata
   - ventes

### ⚠️ Tables avec erreurs (à corriger):
- historique_reglements_clients
- historique_reglements_fournisseurs
- reglements_clients
- reglements_fournisseurs

**Raison:** Ces tables avaient déjà la colonne `userId` OU il manquait l'utilisateur id=1 au moment de l'ajout de la contrainte.

---

## 🔧 Prochaines Étapes

### Étape 1: Corriger les tables manquantes

Exécutez ce script SQL:

```bash
# Dans phpMyAdmin ou votre client MySQL
# Exécutez le fichier: sql/fix_missing_userId_tables.sql
```

### Étape 2: Créer un vrai utilisateur admin avec mot de passe hashé

```bash
cd "knachsoft-api - Copie"
node create_admin_user.js
```

Ce script va:
- Créer ou mettre à jour l'utilisateur admin
- Hasher le mot de passe avec bcrypt
- Afficher tous les utilisateurs
- Vérifier que toutes les tables ont userId

**Credentials par défaut:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@knachsoft.com`
- Role: `admin`

⚠️ **IMPORTANT:** Changez ce mot de passe en production!

---

## 📋 Vérification

### Vérifier que tout est OK:

```sql
-- 1. Vérifier la table users
SELECT * FROM users;

-- 2. Vérifier que toutes les tables ont userId
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'userId'
ORDER BY TABLE_NAME;

-- 3. Compter les tables avec userId (devrait être 18)
SELECT COUNT(DISTINCT TABLE_NAME) AS nb_tables_avec_userId
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'userId';
```

**Résultat attendu:** 18 tables avec userId

---

## 🎯 Prochaines Étapes - Implémentation JWT

### 1. Installer les packages nécessaires

```bash
npm install jsonwebtoken bcryptjs
```

### 2. Créer les fichiers d'authentification

**Fichiers à créer:**
- `routes/auth.js` - Routes d'authentification (login, register, etc.)
- `middleware/auth.js` - Middleware JWT pour protéger les routes
- Mettre à jour `server.js` - Ajouter les routes auth et le middleware

### 3. Mettre à jour toutes les routes existantes

**Pattern à appliquer:**

```javascript
// Avant
router.get('/api/clients', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM clients');
  res.json(rows);
});

// Après
const authMiddleware = require('../middleware/auth');

router.get('/api/clients', authMiddleware, async (req, res) => {
  const userId = req.userId; // Extrait du JWT
  const [rows] = await pool.query(
    'SELECT * FROM clients WHERE userId = ?',
    [userId]
  );
  res.json(rows);
});
```

### 4. Mettre à jour l'application Flutter

**Composants à créer:**
- `lib/services/auth_service.dart` - Gestion authentification
- `lib/screens/login_screen.dart` - Écran de connexion
- Intercepteur HTTP pour ajouter le token JWT automatiquement

---

## 📊 Structure de la Base de Données

```
users (table principale)
├── id (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── password (hash bcrypt)
├── nom
├── prenom
├── telephone
├── adresse
├── role (admin, user, manager)
├── isActive
├── lastLogin
├── createdAt
└── updatedAt

Toutes les autres tables:
├── id (PK)
├── userId (FK → users.id) ← NOUVEAU!
└── ... (autres colonnes)
```

---

## 🔐 Sécurité

### Règles d'or:

1. **Toujours filtrer par userId:**
   ```sql
   SELECT * FROM clients WHERE userId = ?
   ```

2. **Jamais de requête sans userId:**
   ```sql
   -- ❌ MAUVAIS
   SELECT * FROM clients
   
   -- ✅ BON
   SELECT * FROM clients WHERE userId = ?
   ```

3. **Vérifier l'appartenance avant modification:**
   ```sql
   UPDATE clients 
   SET nom = ? 
   WHERE id = ? AND userId = ?
   ```

4. **Utiliser ON DELETE CASCADE:**
   - Si un user est supprimé, toutes ses données sont supprimées automatiquement

---

## 🧪 Tests

### Test 1: Vérifier l'isolation des données

```sql
-- Créer un deuxième utilisateur
INSERT INTO users (username, email, password, nom, role) 
VALUES ('user2', 'user2@test.com', 'hash', 'User 2', 'user');

-- Créer des clients pour chaque user
INSERT INTO clients (userId, nom) VALUES (1, 'Client User 1');
INSERT INTO clients (userId, nom) VALUES (2, 'Client User 2');

-- Vérifier l'isolation
SELECT * FROM clients WHERE userId = 1; -- Devrait retourner 1 client
SELECT * FROM clients WHERE userId = 2; -- Devrait retourner 1 client
```

### Test 2: Vérifier les contraintes

```sql
-- Essayer d'insérer avec un userId inexistant (devrait échouer)
INSERT INTO clients (userId, nom) VALUES (999, 'Test');
-- Erreur: Cannot add or update a child row: a foreign key constraint fails
```

---

## 📝 Fichiers Créés

1. ✅ `sql/create_users_and_add_userId.sql` - Script principal
2. ✅ `sql/fix_missing_userId_tables.sql` - Script de correction
3. ✅ `create_admin_user.js` - Script Node.js pour créer admin
4. ✅ `USERID_SETUP_COMPLETE.md` - Ce document

---

## 🎉 Résumé

### Ce qui a été fait:
- ✅ Table `users` créée
- ✅ Colonne `userId` ajoutée à 14 tables
- ✅ Index créés pour performance
- ✅ Foreign keys créées pour intégrité
- ✅ Utilisateur admin créé (id=1)
- ✅ Toutes les données existantes assignées à userId=1

### Ce qui reste à faire:
- ⏳ Corriger les 4 tables avec erreurs (script fourni)
- ⏳ Créer un vrai mot de passe hashé pour admin (script fourni)
- ⏳ Implémenter les routes d'authentification JWT
- ⏳ Créer le middleware JWT
- ⏳ Protéger toutes les routes existantes
- ⏳ Mettre à jour l'application Flutter

---

## 🚀 Commandes Rapides

```bash
# 1. Créer l'utilisateur admin avec mot de passe hashé
node create_admin_user.js

# 2. Tester la connexion
# (après avoir créé les routes auth)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 3. Tester une route protégée
# (remplacez TOKEN par le JWT reçu)
curl -X GET http://localhost:4000/api/clients \
  -H "Authorization: Bearer TOKEN"
```

---

## 📞 Support

Si vous avez des questions ou des problèmes:
1. Vérifiez que la table `users` existe
2. Vérifiez que l'utilisateur admin (id=1) existe
3. Vérifiez que toutes les tables ont la colonne `userId`
4. Exécutez le script de correction si nécessaire

---

**Date:** 20 Décembre 2025  
**Status:** ✅ Configuration de base terminée  
**Prochaine étape:** Implémenter JWT et protéger les routes
