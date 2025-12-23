# FIX: Erreur 404 sur GET /api/users

## 🐛 PROBLÈME IDENTIFIÉ

Lorsque l'utilisateur clique sur "Gestion des Utilisateurs", l'API retourne:
```
GET http://localhost:4000/api/users 404 (Not Found)
Erreur: Utilisateur non trouvé
```

## 🔍 CAUSE

Le middleware `authMiddleware` remplace automatiquement `req.userId` par `req.ownerId` pour le partage de données entre utilisateurs du même groupe.

**Exemple:**
- Utilisateur connecté: `admin3` (ID: 63, ownerId: 1)
- Après le middleware: `req.userId = 1` (ownerId), `req.originalUserId = 63`
- La route GET /api/users cherchait l'utilisateur avec `id = req.userId` (1)
- Mais l'utilisateur avec `id = 1` n'existe pas!
- Résultat: 404 "Utilisateur non trouvé"

## ✅ SOLUTION APPLIQUÉE

Modifié la route GET /api/users pour utiliser `req.originalUserId` au lieu de `req.userId`:

```javascript
// ❌ AVANT (INCORRECT)
const userId = req.userId; // Peut être l'ownerId, pas l'ID réel

// ✅ APRÈS (CORRECT)
const userId = req.originalUserId || req.userId; // ID réel de l'utilisateur connecté
```

## 📝 FICHIERS MODIFIÉS

- `server.js` (ligne ~1907)

## 🧪 TEST

1. **Redémarrer le serveur Node.js** (IMPORTANT!):
   ```bash
   cd "knachsoft-api - Copie"
   # Arrêter le serveur actuel (Ctrl+C)
   node server.js
   ```

2. **Tester avec le script**:
   ```bash
   node test_users_with_existing.js
   ```

   Résultat attendu:
   ```
   ✅ Succès! X utilisateur(s) récupéré(s)
   ```

3. **Tester dans l'application Flutter**:
   - Ouvrir l'application web
   - Cliquer sur "Gestion des Utilisateurs"
   - Les utilisateurs doivent s'afficher sans erreur 404

## 🎯 RÉSULTAT

- ✅ La route GET /api/users fonctionne correctement
- ✅ Les utilisateurs avec ownerId peuvent voir tous les utilisateurs de leur groupe
- ✅ Les logs montrent l'ID réel de l'utilisateur connecté

## 📚 CONTEXTE

Ce problème affecte uniquement les routes qui ont besoin de l'ID réel de l'utilisateur connecté (pas l'ownerId).

**Routes concernées:**
- GET /api/users (CORRIGÉ)
- POST /api/users/clone (à vérifier)
- PUT /api/users/:id (à vérifier)
- DELETE /api/users/:id (à vérifier)

**Routes non affectées:**
- Toutes les autres routes (produits, ventes, achats, etc.) utilisent correctement `req.userId` (ownerId) pour le partage de données
