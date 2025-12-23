# 🏗️ Architecture Multi-Utilisateurs

## ❌ Problème Actuel

Vous voulez que plusieurs utilisateurs (admin + vendeurs) partagent le **même `id`** dans la table `users`, mais c'est **impossible** car `id` est la clé primaire (unique).

## ✅ Solution Recommandée: Colonne `ownerId`

### Principe
- Chaque utilisateur a son propre `id` unique
- Les vendeurs ont une colonne `ownerId` qui pointe vers l'admin propriétaire
- Toutes les données (ventes, achats, clients, etc.) sont filtrées par `ownerId` au lieu de `id`

### Exemple
```
users:
id | username | password | role    | ownerId
1  | admin    | xxx      | admin   | NULL (ou 1)
2  | vendeur1 | yyy      | vendeur | 1
3  | vendeur2 | zzz      | vendeur | 1

ventes:
id | clientId | montant | userId (devient ownerId)
1  | 5        | 1000    | 1
2  | 6        | 2000    | 1
```

### Avantages
✅ Respecte les contraintes MySQL (id unique)
✅ Facile à implémenter
✅ Permet de savoir qui a créé chaque enregistrement
✅ Partage des données entre admin et vendeurs

### Modifications Nécessaires

#### 1. Base de données
```sql
-- Ajouter la colonne ownerId à la table users
ALTER TABLE users ADD COLUMN ownerId INT DEFAULT NULL;
ALTER TABLE users ADD FOREIGN KEY (ownerId) REFERENCES users(id);

-- Pour l'admin existant, définir ownerId = id
UPDATE users SET ownerId = id WHERE role = 'admin';
```

#### 2. API (server.js)
- Route `/api/users/clone` : Créer un vendeur avec `ownerId = currentUserId`
- Toutes les routes : Filtrer par `ownerId` au lieu de `userId`

#### 3. Flutter (add_user_screen.dart)
- Aucun changement nécessaire (déjà prêt)

## 🔄 Alternative: Table `sub_users`

Si vous préférez séparer complètement les sous-utilisateurs :

```sql
CREATE TABLE sub_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ownerId INT NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('vendeur') NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id)
);
```

Mais cette approche nécessite plus de modifications dans le code.

## 📋 Prochaines Étapes

1. Choisir l'architecture (je recommande `ownerId`)
2. Exécuter le script SQL pour ajouter la colonne
3. Modifier la route `/api/users/clone`
4. Modifier les filtres dans toutes les routes API
5. Tester la création d'un vendeur
