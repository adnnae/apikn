# 🧪 TEST: Partage des informations de société

## 🚀 DÉMARRAGE

### 1. Redémarrer le serveur
```bash
cd "knachsoft-api - Copie"
# Arrêter le serveur (Ctrl+C)
node server.js
```

### 2. Lancer l'application Flutter
```bash
cd "knachsoftmobile - Copie"
flutter run -d chrome
```

---

## ✅ TESTS À EFFECTUER

### Test 1: Admin modifie les informations

1. Se connecter en tant qu'admin
2. Aller dans "Paramètres"
3. Remplir les informations:
   - Nom société: `Test Société`
   - Ville: `Casablanca`
   - Téléphone: `0612345678`
   - ICE: `123456789`
4. Cliquer sur "Enregistrer"
5. ✅ Vérifier: Message "Informations sauvegardées"
6. ✅ Vérifier dans les logs du serveur:
   ```
   ✅ [API] Informations société mises à jour pour ownerId=X
   ```

### Test 2: Vendeur voit les informations de l'admin

1. Se déconnecter
2. Se connecter en tant que vendeur
3. Aller dans "Paramètres"
4. ✅ Vérifier: Les informations de l'admin sont affichées
   - Nom société: `Test Société`
   - Ville: `Casablanca`
   - Téléphone: `0612345678`
   - ICE: `123456789`

### Test 3: Vendeur modifie les informations

1. Toujours connecté en tant que vendeur
2. Dans "Paramètres", modifier:
   - Adresse: `123 Rue Test`
3. Cliquer sur "Enregistrer"
4. ✅ Vérifier: Message "Informations sauvegardées"

### Test 4: Admin voit les modifications du vendeur

1. Se déconnecter
2. Se reconnecter en tant qu'admin
3. Aller dans "Paramètres"
4. ✅ Vérifier: Les modifications du vendeur sont visibles
   - Adresse: `123 Rue Test`

### Test 5: Logo partagé

1. Connecté en tant qu'admin
2. Dans "Paramètres", ajouter un logo
3. Cliquer sur "Enregistrer"
4. Se déconnecter
5. Se connecter en tant que vendeur
6. Aller dans "Paramètres"
7. ✅ Vérifier: Le logo de l'admin est visible

---

## 🔍 VÉRIFICATION DANS MYSQL

### Vérifier les données dans la base

```sql
-- Voir tous les utilisateurs et leurs ownerId
SELECT id, username, role, ownerId, nomSociete, ville, ice 
FROM users 
ORDER BY id;

-- Résultat attendu:
-- id | username | role    | ownerId | nomSociete    | ville      | ice
-- 1  | admin    | admin   | 1       | Test Société  | Casablanca | 123456789
-- 2  | vendeur1 | vendeur | 1       | NULL          | NULL       | NULL
-- 3  | vendeur2 | vendeur | 1       | NULL          | NULL       | NULL

-- Les vendeurs ont ownerId=1, donc ils lisent les infos de l'admin (id=1)
```

---

## 📊 LOGS ATTENDUS

### Lors de la sauvegarde par l'admin
```
✅ [AUTH] User admin (ID: 1) authentifié
🔄 [AUTH] Partage de données: userId 1 → ownerId 1
📤 [SETTINGS] Sauvegarde vers MySQL...
✅ [API] Informations société mises à jour pour ownerId=1
```

### Lors du chargement par le vendeur
```
✅ [AUTH] User vendeur1 (ID: 2) authentifié
🔄 [AUTH] Partage de données: userId 2 → ownerId 1
📥 [SETTINGS] Chargement depuis MySQL...
✅ [API] Informations société récupérées pour ownerId=1
```

---

## ❌ ERREURS POSSIBLES

### Erreur 404
```
GET http://localhost:4000/api/users/company-info 404 (Not Found)
```

**Causes possibles:**
1. Le serveur n'est pas redémarré
2. L'utilisateur owner (ownerId) n'existe pas dans la base
3. Les colonnes company-info n'existent pas

**Solutions:**
1. Redémarrer le serveur: `node server.js`
2. Vérifier les utilisateurs: `node check_users.js`
3. Exécuter le script SQL: `mysql -u root -p knachsoft < sql/add_company_info_to_users.sql`

### Erreur 500
```
Erreur serveur
```

**Causes possibles:**
1. Colonnes manquantes dans la table users
2. Erreur de connexion MySQL

**Solutions:**
1. Vérifier la structure: `DESCRIBE users;`
2. Ajouter les colonnes manquantes: `sql/add_company_info_to_users.sql`

---

## ✨ RÉSULTAT ATTENDU

Après tous les tests:
- ✅ Admin peut modifier les informations
- ✅ Vendeur voit les informations de l'admin
- ✅ Vendeur peut modifier les informations
- ✅ Admin voit les modifications du vendeur
- ✅ Logo et cachet sont partagés
- ✅ Tous les utilisateurs du même groupe voient les mêmes données

**Le partage des informations de société fonctionne parfaitement!** 🎉
