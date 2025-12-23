# 🔧 FIX: Fallback pour informations de société

## ❌ PROBLÈME

Quand un admin est authentifié (par exemple admin3 avec id=63, ownerId=1), mais que l'utilisateur owner (id=1) n'existe pas:
- GET retourne 404
- PUT ne trouve personne à mettre à jour
- Les données ne sont pas sauvegardées

## ✅ SOLUTION

Ajouter un **fallback**: si l'owner n'existe pas, utiliser l'utilisateur connecté.

### Logique

```javascript
// 1. Essayer avec ownerId
const ownerId = req.ownerId || req.userId;  // Ex: 1
const currentUserId = req.originalUserId;    // Ex: 63

// 2. Vérifier si l'owner existe
const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);

// 3. Utiliser currentUserId si owner n'existe pas
const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
```

### Résultat

```
Si owner existe (id=1):
  → Utilise owner (id=1) ✅ Partage entre tous

Si owner n'existe pas:
  → Utilise currentUser (id=63) ✅ Sauvegarde quand même
```

---

## 🔄 ROUTES MODIFIÉES

### 1. GET /api/users/company-info
- Essaie de lire depuis owner
- Si owner n'existe pas, lit depuis currentUser
- Plus de 404!

### 2. PUT /api/users/company-info
- Essaie de mettre à jour owner
- Si owner n'existe pas, met à jour currentUser
- Les données sont sauvegardées!

### 3. PUT /api/users/logo
- Même logique

### 4. PUT /api/users/signature
- Même logique

### 5. DELETE /api/users/logo
- Même logique

### 6. DELETE /api/users/signature
- Même logique

---

## 🎯 AVANTAGES

### 1. Robustesse
- ✅ Fonctionne même si owner n'existe pas
- ✅ Pas d'erreur 404
- ✅ Les données sont toujours sauvegardées

### 2. Flexibilité
- ✅ Si owner existe → Partage entre tous
- ✅ Si owner n'existe pas → Sauvegarde individuelle
- ✅ Transition en douceur

### 3. Compatibilité
- ✅ Fonctionne avec les anciennes bases de données
- ✅ Fonctionne avec les nouvelles bases de données
- ✅ Pas de migration nécessaire

---

## 📊 SCÉNARIOS

### Scénario 1: Owner existe
```
Admin3 (id=63, ownerId=1)
Owner (id=1) existe ✅

GET /api/users/company-info
→ Lit depuis owner (id=1)
→ Partage avec tous les utilisateurs

PUT /api/users/company-info
→ Met à jour owner (id=1)
→ Tous les utilisateurs voient les changements
```

### Scénario 2: Owner n'existe pas
```
Admin3 (id=63, ownerId=1)
Owner (id=1) n'existe pas ❌

GET /api/users/company-info
→ Lit depuis admin3 (id=63)
→ Pas d'erreur 404

PUT /api/users/company-info
→ Met à jour admin3 (id=63)
→ Les données sont sauvegardées
```

---

## 🧪 TEST

### Avant le fix
```
1. Se connecter en tant qu'admin3
2. Aller dans Paramètres
3. Remplir les informations
4. Cliquer sur Enregistrer
5. ❌ Erreur 404 ou données non sauvegardées
```

### Après le fix
```
1. Se connecter en tant qu'admin3
2. Aller dans Paramètres
3. Remplir les informations
4. Cliquer sur Enregistrer
5. ✅ Message de succès
6. ✅ Données sauvegardées dans MySQL
7. ✅ Rechargement fonctionne
```

---

## 📝 LOGS ATTENDUS

### Avec owner existant
```
✅ [API] Informations société récupérées pour userId=1
✅ [API] Informations société mises à jour pour userId=1
```

### Sans owner (fallback)
```
⚠️ [API] Owner 1 introuvable, utilisation de l'utilisateur connecté 63
✅ [API] Informations société récupérées pour userId=63
✅ [API] Informations société mises à jour pour userId=63
```

---

## ✨ RÉSULTAT

Maintenant, **peu importe si l'owner existe ou non**, les informations de société fonctionnent toujours:
- ✅ Chargement sans erreur 404
- ✅ Sauvegarde réussie
- ✅ Partage si owner existe
- ✅ Sauvegarde individuelle si owner n'existe pas

**Le système est robuste et flexible!** 🎉
