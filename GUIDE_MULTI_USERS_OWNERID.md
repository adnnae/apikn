# 🎯 Guide d'Implémentation Multi-Utilisateurs avec ownerId

## 📋 Vue d'Ensemble

Ce système permet à un admin de créer plusieurs vendeurs qui partagent les mêmes données (ventes, achats, clients, etc.).

### Architecture
- **Admin** : Propriétaire des données (`ownerId = id`)
- **Vendeurs** : Utilisateurs liés à l'admin (`ownerId = admin.id`)
- **Partage** : Tous les utilisateurs avec le même `ownerId` voient les mêmes données

## 🚀 Installation

### Étape 1: Ajouter la colonne `ownerId` à la base de données

```bash
# Depuis le dossier knachsoft-api - Copie
mysql -u root -p knachsoft < sql/add_ownerId_to_users.sql
```

Ou exécutez manuellement dans MySQL Workbench :
```sql
-- Voir le fichier: sql/add_ownerId_to_users.sql
```

### Étape 2: Redémarrer le serveur API

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
node server.js
```

### Étape 3: Tester la création d'utilisateurs

```bash
node test_multi_users.js
```

## 📊 Modifications Effectuées

### 1. Base de Données
- ✅ Ajout colonne `ownerId` dans table `users`
- ✅ Index sur `ownerId` pour performance
- ✅ Mise à jour des admins existants (`ownerId = id`)

### 2. API (server.js)
- ✅ Route `POST /api/users/clone` : Crée un vendeur avec `ownerId = admin.id`
- ✅ Route `GET /api/users` : Retourne tous les utilisateurs avec le même `ownerId`

### 3. Flutter (add_user_screen.dart)
- ✅ Déjà prêt (utilise `/api/users/clone`)

## 🧪 Test Manuel

### 1. Connexion Admin
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Récupérez le `token` dans la réponse.

### 2. Créer un Vendeur
```bash
curl -X POST http://localhost:4000/api/users/clone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "username":"vendeur1",
    "password":"vendeur123",
    "role":"vendeur"
  }'
```

### 3. Lister les Utilisateurs
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

Vous devriez voir l'admin ET le vendeur avec le même `ownerId`.

### 4. Connexion Vendeur
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"vendeur1","password":"vendeur123"}'
```

### 5. Vérifier que le Vendeur Voit les Mêmes Utilisateurs
```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN_DU_VENDEUR"
```

## 📱 Utilisation dans Flutter

### Créer un Vendeur
1. Connectez-vous en tant qu'admin
2. Allez dans le menu "Rôles" (drawer)
3. Cliquez sur "Ajouter un utilisateur"
4. Remplissez le formulaire :
   - Username: `vendeur1`
   - Password: `vendeur123`
   - Rôle: `Vendeur`
5. Cliquez sur "Créer"

### Connexion Vendeur
1. Déconnectez-vous
2. Connectez-vous avec :
   - Username: `vendeur1`
   - Password: `vendeur123`
3. Le vendeur voit uniquement "Ventes" et "Clients" dans le menu
4. Les données sont partagées avec l'admin

## 🔍 Vérification

### Dans MySQL
```sql
-- Voir tous les utilisateurs avec leur ownerId
SELECT id, username, role, ownerId FROM users;

-- Résultat attendu:
-- id | username | role    | ownerId
-- 1  | admin    | admin   | 1
-- 2  | vendeur1 | vendeur | 1
-- 3  | vendeur2 | vendeur | 1
```

### Dans l'Application
- Admin voit : Tous les menus + tous les utilisateurs
- Vendeur voit : Ventes + Clients uniquement
- Les deux voient les mêmes données (ventes, clients, etc.)

## ⚠️ Important

### Données Partagées
Tous les utilisateurs avec le même `ownerId` partagent :
- ✅ Ventes
- ✅ Achats
- ✅ Clients
- ✅ Fournisseurs
- ✅ Produits
- ✅ Stock
- ✅ Règlements
- ✅ Dépenses
- ✅ Caisse

### Permissions
- **Admin** : Peut tout faire (créer, modifier, supprimer)
- **Vendeur** : Peut uniquement créer des ventes et gérer les clients

## 🐛 Dépannage

### Erreur: "Colonne ownerId n'existe pas"
```bash
# Exécutez le script SQL
mysql -u root -p knachsoft < sql/add_ownerId_to_users.sql
```

### Erreur: "Username existe déjà"
Le username doit être unique dans toute la base de données.

### Le vendeur ne voit pas les données
Vérifiez que `ownerId` est bien défini :
```sql
SELECT id, username, ownerId FROM users WHERE username = 'vendeur1';
```

## 📚 Prochaines Étapes

1. ✅ Ajouter `ownerId` à la table `users`
2. ✅ Modifier les routes API
3. ⏳ Tester la création d'utilisateurs
4. ⏳ Tester la connexion vendeur
5. ⏳ Vérifier le partage des données
