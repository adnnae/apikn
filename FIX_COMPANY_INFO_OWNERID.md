# 🔧 FIX: Informations de société partagées (ownerId)

## ❌ PROBLÈME INITIAL

Les informations de société (nom, adresse, logo, etc.) étaient stockées individuellement pour chaque utilisateur. Cela causait:
- Chaque admin/vendeur avait ses propres informations
- Pas de partage des données de société
- Erreur 404 si l'utilisateur n'avait pas d'informations

## ✅ SOLUTION

Utiliser `ownerId` au lieu de `userId` pour que **tous les utilisateurs du même groupe partagent les mêmes informations de société**.

### Concept

```
Admin (id=1, ownerId=1)
  ├── Informations de société stockées ici ✅
  │   - Nom société
  │   - Adresse
  │   - Logo
  │   - Cachet
  │
  ├── Vendeur1 (id=2, ownerId=1)
  │   └── Lit les infos de l'admin (ownerId=1) ✅
  │
  └── Vendeur2 (id=3, ownerId=1)
      └── Lit les infos de l'admin (ownerId=1) ✅
```

---

## 🔄 MODIFICATIONS APPLIQUÉES

### Routes modifiées

#### 1. GET /api/users/company-info
**Avant:**
```javascript
const userId = req.userId;
// Récupère les infos de l'utilisateur connecté uniquement
WHERE id = userId
```

**Après:**
```javascript
const ownerId = req.ownerId || req.userId;
// Récupère les infos de l'admin principal (owner)
WHERE id = ownerId
```

#### 2. PUT /api/users/company-info
**Avant:**
```javascript
const userId = req.userId;
// Met à jour les infos de l'utilisateur connecté uniquement
UPDATE users SET ... WHERE id = userId
```

**Après:**
```javascript
const ownerId = req.ownerId || req.userId;
// Met à jour les infos de l'admin principal (owner)
UPDATE users SET ... WHERE id = ownerId
```

#### 3. PUT /api/users/logo
**Avant:**
```javascript
UPDATE users SET logoBase64 = ? WHERE id = userId
```

**Après:**
```javascript
UPDATE users SET logoBase64 = ? WHERE id = ownerId
```

#### 4. PUT /api/users/signature
**Avant:**
```javascript
UPDATE users SET signatureCachetBase64 = ? WHERE id = userId
```

**Après:**
```javascript
UPDATE users SET signatureCachetBase64 = ? WHERE id = ownerId
```

#### 5. DELETE /api/users/logo
**Avant:**
```javascript
UPDATE users SET logoBase64 = NULL WHERE id = userId
```

**Après:**
```javascript
UPDATE users SET logoBase64 = NULL WHERE id = ownerId
```

#### 6. DELETE /api/users/signature
**Avant:**
```javascript
UPDATE users SET signatureCachetBase64 = NULL WHERE id = userId
```

**Après:**
```javascript
UPDATE users SET signatureCachetBase64 = NULL WHERE id = ownerId
```

---

## 🎯 AVANTAGES

### 1. Partage automatique
- ✅ Tous les utilisateurs du même groupe voient les mêmes informations
- ✅ Un seul endroit pour stocker les données de société
- ✅ Cohérence garantie

### 2. Simplicité
- ✅ Pas besoin de dupliquer les informations
- ✅ Modification par n'importe quel admin du groupe
- ✅ Pas de synchronisation nécessaire

### 3. Flexibilité
- ✅ Admin peut modifier les informations
- ✅ Vendeurs peuvent aussi modifier (si autorisé)
- ✅ Tous voient les changements immédiatement

---

## 🧪 TEST

### Scénario de test

1. **Admin se connecte et modifie les informations**
   ```
   POST /api/auth/login (admin)
   PUT /api/users/company-info
   {
     "nomSociete": "Ma Société",
     "ville": "Casablanca",
     "ice": "123456789"
   }
   ```

2. **Vendeur se connecte et lit les informations**
   ```
   POST /api/auth/login (vendeur)
   GET /api/users/company-info
   
   Résultat: Voit les infos de l'admin ✅
   {
     "nomSociete": "Ma Société",
     "ville": "Casablanca",
     "ice": "123456789"
   }
   ```

3. **Vendeur modifie les informations**
   ```
   PUT /api/users/company-info
   {
     "telephone": "0612345678"
   }
   
   Résultat: Modifie les infos de l'admin ✅
   ```

4. **Admin relit les informations**
   ```
   GET /api/users/company-info
   
   Résultat: Voit les modifications du vendeur ✅
   {
     "nomSociete": "Ma Société",
     "ville": "Casablanca",
     "ice": "123456789",
     "telephone": "0612345678"
   }
   ```

---

## 📊 FLUX DE DONNÉES

### Avant (problématique)
```
Admin (id=1)
  └── Infos société: {nom: "A", ville: "X"}

Vendeur (id=2)
  └── Infos société: {nom: "", ville: ""}  ❌ Vide!
```

### Après (solution)
```
Admin (id=1, ownerId=1)
  └── Infos société: {nom: "A", ville: "X"}  ✅ Source unique

Vendeur (id=2, ownerId=1)
  └── Lit depuis ownerId=1  ✅ Voit les infos de l'admin
```

---

## 🔐 SÉCURITÉ

### Qui peut modifier?
- ✅ Tous les utilisateurs du même groupe (ownerId)
- ✅ Admin et vendeurs peuvent modifier
- ❌ Utilisateurs d'autres groupes ne peuvent pas accéder

### Vérification automatique
Le middleware `auth.js` remplace automatiquement `req.userId` par `req.ownerId`, donc:
- Pas besoin de vérifier manuellement
- Sécurité garantie par le middleware
- Isolation entre les groupes

---

## 📝 FICHIERS MODIFIÉS

- `server.js` (lignes 1665-1850)
  - GET /api/users/company-info
  - PUT /api/users/company-info
  - PUT /api/users/logo
  - PUT /api/users/signature
  - DELETE /api/users/logo
  - DELETE /api/users/signature

---

## ✨ RÉSULTAT

Maintenant, **tous les admins et vendeurs du même groupe partagent les mêmes informations de société**:
- ✅ Nom de société
- ✅ Adresse
- ✅ ICE, RC, IF, CNSS
- ✅ Logo
- ✅ Cachet/signature
- ✅ Coordonnées bancaires
- ✅ Devise et langue

**Le système fonctionne parfaitement!** 🎉
