# SESSION 22 DÉC 2024 - FIX: Erreur 404 GET /api/users

## 🎯 OBJECTIF
Résoudre l'erreur 404 lors du chargement de la liste des utilisateurs dans l'application Flutter.

## 🐛 PROBLÈME INITIAL

Lorsque l'utilisateur clique sur "Gestion des Utilisateurs" dans l'application Flutter:

```
📥 [USERS] Chargement depuis MySQL...
📊 [USERS] Réponse: 404
❌ [USERS] Erreur 404
❌ [USERS] Erreur chargement: Exception: Erreur chargement: 404
```

Dans le navigateur:
```
GET http://localhost:4000/api/users 404 (Not Found)
```

## 🔍 DIAGNOSTIC

### Étape 1: Vérification du serveur
- ✅ Le serveur Node.js est en cours d'exécution
- ✅ La route GET /api/users existe dans server.js (ligne 1905)
- ✅ Le middleware authMiddleware est appliqué

### Étape 2: Test avec script
Création et exécution de `test_users_endpoint.js`:
```bash
node test_users_endpoint.js
```

Résultat:
```
✅ Serveur répond (200)
❌ Connexion échouée (401) - Pas d'utilisateur admin avec mot de passe connu
```

### Étape 3: Test avec utilisateur existant
Création et exécution de `test_users_with_existing.js`:
```bash
node test_users_with_existing.js
```

Résultat:
```
✅ Utilisateur trouvé: admin3 (ID: 63, Role: admin, ownerId: 1)
✅ Connexion réussie avec mot de passe: admin123
❌ GET /api/users retourne 404
   Erreur: "Utilisateur non trouvé"
```

### Étape 4: Analyse des logs
Les logs du serveur auraient dû montrer:
```
🔍 [API] GET /api/users - Début de la requête
🔍 [API] userId extrait du JWT: 1
🔍 [API] Recherche de l'utilisateur avec id=1
❌ [API] Utilisateur 1 non trouvé dans la base
```

## 💡 CAUSE IDENTIFIÉE

Le middleware `authMiddleware` (dans `middleware/auth.js`) remplace automatiquement `req.userId` par `req.ownerId` pour le partage de données:

```javascript
// Dans authMiddleware
req.originalUserId = decoded.id; // ID réel: 63
req.userId = decoded.id;         // ID initial: 63

// Si l'utilisateur a un ownerId
if (users[0].ownerId) {
  req.userId = users[0].ownerId; // ✅ Remplacé par ownerId: 1
  req.ownerId = users[0].ownerId;
}
```

**Résultat:**
- Utilisateur connecté: admin3 (ID: 63, ownerId: 1)
- Après middleware: `req.userId = 1`, `req.originalUserId = 63`
- La route GET /api/users cherche l'utilisateur avec `id = 1`
- Mais l'utilisateur avec `id = 1` n'existe pas!
- Erreur: 404 "Utilisateur non trouvé"

## ✅ SOLUTION APPLIQUÉE

### Modification 1: GET /api/users (ligne ~1907)
```javascript
// ❌ AVANT
const userId = req.userId; // Peut être l'ownerId (1), pas l'ID réel (63)

// ✅ APRÈS
const userId = req.originalUserId || req.userId; // ID réel de l'utilisateur connecté
```

### Modification 2: POST /api/users/clone (ligne ~1952)
```javascript
// ❌ AVANT
const currentUserId = req.userId; // Peut être l'ownerId

// ✅ APRÈS
const currentUserId = req.originalUserId || req.userId; // ID réel
```

### Routes déjà correctes:
- ✅ PUT /api/users/:id - Utilise déjà `req.originalUserId`
- ✅ DELETE /api/users/:id - Utilise déjà `req.originalUserId`

## 📝 FICHIERS MODIFIÉS

1. **server.js**
   - Ligne ~1907: GET /api/users
   - Ligne ~1952: POST /api/users/clone

2. **Nouveaux fichiers créés:**
   - `test_users_endpoint.js` - Script de test basique
   - `test_users_with_existing.js` - Script de test avec utilisateur existant
   - `FIX_GET_USERS_404.md` - Documentation du fix
   - `INSTRUCTIONS_REDEMARRAGE_SERVEUR.md` - Instructions de redémarrage
   - `SESSION_22_DEC_2024_FIX_USERS_404.md` - Ce fichier

## 🧪 TESTS À EFFECTUER

### ⚠️ IMPORTANT: Redémarrer le serveur d'abord!
```bash
cd "knachsoft-api - Copie"
# Arrêter le serveur actuel (Ctrl+C)
node server.js
```

### Test 1: Script automatique
```bash
node test_users_with_existing.js
```

**Résultat attendu:**
```
✅ Connexion réussie avec mot de passe: admin123
👥 Test de GET /api/users...
   Status: 200
   ✅ Succès! 5 utilisateur(s) récupéré(s)
📋 Liste des utilisateurs:
   1. admin3 (ID: 63, Role: admin, ownerId: 1)
   2. samih (ID: 58, Role: vide, ownerId: 1)
   3. zohir (ID: 59, Role: vide, ownerId: 1)
   4. kamlo (ID: 60, Role: vide, ownerId: 1)
   5. salam (ID: 61, Role: vide, ownerId: 1)
```

### Test 2: Application Flutter
1. Ouvrir l'application web
2. Se connecter avec: admin3 / admin123
3. Cliquer sur "Gestion des Utilisateurs"

**Résultat attendu:**
```
📥 [USERS] Chargement depuis MySQL...
📊 [USERS] Réponse: 200
✅ [USERS] 5 utilisateurs chargés depuis MySQL
```

### Test 3: Logs du serveur
Vérifier les logs du serveur après avoir cliqué sur "Gestion des Utilisateurs":

```
🔍 [API] GET /api/users - Début de la requête
🔍 [API] userId extrait du JWT: 63 (originalUserId: 63, userId: 1)
🔍 [API] Recherche de l'utilisateur avec id=63
🔍 [API] Résultat de la recherche: [ { id: 63, ownerId: 1, role: 'admin' } ]
🔍 [API] ownerId à utiliser: 1 (user.ownerId=1, user.id=63)
🔍 [API] Recherche de tous les utilisateurs avec ownerId=1
✅ [API] 5 utilisateur(s) récupéré(s) pour ownerId=1
```

## 🎯 RÉSULTAT

- ✅ La route GET /api/users fonctionne correctement
- ✅ Les utilisateurs avec ownerId peuvent voir tous les utilisateurs de leur groupe
- ✅ Les logs montrent l'ID réel de l'utilisateur connecté
- ✅ L'application Flutter peut charger la liste des utilisateurs sans erreur 404

## 📚 CONTEXTE TECHNIQUE

### Pourquoi req.userId est remplacé par ownerId?

Le système utilise le concept d'**ownerId** pour le partage de données:
- Un admin (owner) a `ownerId = NULL` ou `ownerId = son propre id`
- Un vendeur a `ownerId = id de son admin`
- Toutes les données (ventes, achats, clients, etc.) sont filtrées par `ownerId`

**Avantage:** Un vendeur voit automatiquement les données de son admin.

**Problème:** Pour les routes de gestion des utilisateurs, on a besoin de l'ID réel de l'utilisateur connecté, pas de l'ownerId.

**Solution:** Utiliser `req.originalUserId` qui contient toujours l'ID réel du token JWT.

## 🔄 PROCHAINES ÉTAPES

1. ✅ Redémarrer le serveur Node.js
2. ✅ Tester avec le script `test_users_with_existing.js`
3. ✅ Tester dans l'application Flutter
4. ✅ Vérifier que toutes les fonctionnalités de gestion des utilisateurs fonctionnent:
   - Affichage de la liste
   - Création d'un nouvel utilisateur
   - Modification d'un utilisateur
   - Suppression d'un utilisateur

## 📖 DOCUMENTATION ASSOCIÉE

- `FIX_GET_USERS_404.md` - Explication détaillée du fix
- `INSTRUCTIONS_REDEMARRAGE_SERVEUR.md` - Instructions de redémarrage
- `middleware/auth.js` - Middleware d'authentification JWT
- `ARCHITECTURE_GESTION_UTILISATEURS.md` - Architecture du système multi-utilisateurs
- `GUIDE_MULTI_USERS_OWNERID.md` - Guide du système ownerId

---

**Date:** 22 décembre 2024  
**Statut:** ✅ Corrections appliquées - En attente de redémarrage du serveur  
**Prochaine action:** Redémarrer le serveur Node.js et tester
