# 🔧 INSTRUCTIONS: Redémarrage du serveur Node.js

## ✅ CORRECTIONS APPLIQUÉES

Les routes de gestion des utilisateurs ont été corrigées pour utiliser `req.originalUserId` au lieu de `req.userId`:

### Routes modifiées:
1. **GET /api/users** - Récupérer la liste des utilisateurs
2. **POST /api/users/clone** - Créer un nouvel utilisateur

### Problème résolu:
Le middleware `authMiddleware` remplace automatiquement `req.userId` par `req.ownerId` pour le partage de données. Cela causait une erreur 404 car la route cherchait un utilisateur avec l'ownerId au lieu de l'ID réel.

## 🚀 REDÉMARRER LE SERVEUR (OBLIGATOIRE!)

Les modifications ne prendront effet qu'après le redémarrage du serveur.

### Étape 1: Arrêter le serveur actuel
Dans le terminal où le serveur Node.js est en cours d'exécution:
- Appuyez sur **Ctrl+C** pour arrêter le serveur

### Étape 2: Redémarrer le serveur
```bash
cd "knachsoft-api - Copie"
node server.js
```

Vous devriez voir:
```
✅ Nouvelle connexion MySQL établie
✅ API MySQL démarrée sur http://localhost:4000
```

## 🧪 TESTER LES CORRECTIONS

### Test 1: Script automatique
```bash
cd "knachsoft-api - Copie"
node test_users_with_existing.js
```

**Résultat attendu:**
```
✅ Succès! X utilisateur(s) récupéré(s)
📋 Liste des utilisateurs:
   1. admin3 (ID: 63, Role: admin, ownerId: 1)
   2. samih (ID: 58, Role: vide, ownerId: 1)
   ...
```

### Test 2: Application Flutter
1. Ouvrir l'application web Flutter
2. Se connecter avec un compte admin (ex: admin3 / admin123)
3. Cliquer sur **"Gestion des Utilisateurs"**
4. Les utilisateurs doivent s'afficher sans erreur 404

**Avant (ERREUR):**
```
GET http://localhost:4000/api/users 404 (Not Found)
❌ [USERS] Erreur 404
```

**Après (SUCCÈS):**
```
GET http://localhost:4000/api/users 200 (OK)
✅ [USERS] X utilisateurs chargés depuis MySQL
```

## 📊 VÉRIFIER LES LOGS DU SERVEUR

Après avoir cliqué sur "Gestion des Utilisateurs", vous devriez voir dans les logs du serveur:

```
🔍 [API] GET /api/users - Début de la requête
🔍 [API] userId extrait du JWT: 63 (originalUserId: 63, userId: 1)
🔍 [API] Recherche de l'utilisateur avec id=63
🔍 [API] Résultat de la recherche: [ { id: 63, ownerId: 1, role: 'admin' } ]
🔍 [API] ownerId à utiliser: 1 (user.ownerId=1, user.id=63)
🔍 [API] Recherche de tous les utilisateurs avec ownerId=1
✅ [API] 5 utilisateur(s) récupéré(s) pour ownerId=1
```

## ❓ EN CAS DE PROBLÈME

### Problème 1: Le serveur ne démarre pas
```
Error: Cannot find module 'express'
```
**Solution:** Installer les dépendances
```bash
cd "knachsoft-api - Copie"
npm install
```

### Problème 2: Erreur de connexion MySQL
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Vérifier que MySQL est démarré
- Ouvrir XAMPP ou WAMP
- Démarrer le service MySQL

### Problème 3: Toujours erreur 404
**Vérifications:**
1. Le serveur a-t-il été redémarré? (Ctrl+C puis `node server.js`)
2. Le bon serveur est-il en cours d'exécution? (vérifier le port 4000)
3. Y a-t-il des erreurs au démarrage du serveur?

### Problème 4: Aucun utilisateur trouvé
```
✅ [API] 0 utilisateur(s) récupéré(s) pour ownerId=1
```
**Solution:** Les utilisateurs n'ont pas d'ownerId défini
```bash
node check_users.js
```
Puis mettre à jour les ownerId manuellement ou créer un nouvel admin:
```bash
node create_main_admin.js
```

## 📝 FICHIERS MODIFIÉS

- `server.js` (lignes ~1907 et ~1952)
- `FIX_GET_USERS_404.md` (documentation)
- `test_users_with_existing.js` (script de test)
- `INSTRUCTIONS_REDEMARRAGE_SERVEUR.md` (ce fichier)

## 🎯 PROCHAINES ÉTAPES

Une fois le serveur redémarré et testé:
1. ✅ Vérifier que la liste des utilisateurs s'affiche
2. ✅ Tester la création d'un nouvel utilisateur
3. ✅ Tester la modification d'un utilisateur
4. ✅ Tester la suppression d'un utilisateur

Toutes ces fonctionnalités devraient maintenant fonctionner correctement!
