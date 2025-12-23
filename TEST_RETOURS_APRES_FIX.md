# Test des Retours après correction userId

## ✅ Corrections appliquées

1. **Colonne userId ajoutée** aux tables:
   - `lignes_retour_vente`
   - `lignes_retour_achat`

2. **Script de création mis à jour** pour inclure userId dès le départ

## 🧪 Tests à effectuer

### Test 1: Créer un retour vente

1. Ouvrez l'application Flutter
2. Allez dans "Retours Ventes"
3. Créez un nouveau retour vente
4. Ajoutez des lignes de produits
5. Enregistrez

**Résultat attendu:** Le retour doit être créé sans erreur "Unknown column 'userId'"

### Test 2: Créer un retour achat

1. Allez dans "Retours Achats"
2. Créez un nouveau retour achat
3. Ajoutez des lignes de produits
4. Enregistrez

**Résultat attendu:** Le retour doit être créé sans erreur

### Test 3: Vérifier la synchronisation

1. Ouvrez l'historique de synchronisation
2. Vérifiez qu'il n'y a plus d'erreurs sur les lignes de retours
3. Les statuts doivent être "Synchronisés" (vert)

## 📊 Vérification dans MySQL

Pour vérifier que les données sont bien enregistrées:

```sql
-- Vérifier la structure des tables
DESCRIBE lignes_retour_vente;
DESCRIBE lignes_retour_achat;

-- Vérifier les données
SELECT * FROM lignes_retour_vente ORDER BY id DESC LIMIT 10;
SELECT * FROM lignes_retour_achat ORDER BY id DESC LIMIT 10;

-- Vérifier que userId est bien rempli
SELECT id, userId, retourVenteId, produitId, quantite 
FROM lignes_retour_vente 
WHERE userId IS NOT NULL;
```

## 🎯 Prochaines étapes

Si les tests passent:
- ✅ Le problème userId est résolu
- ✅ Les retours peuvent être créés normalement
- ✅ La synchronisation fonctionne

Si des erreurs persistent:
- Vérifier les logs du serveur API
- Vérifier l'historique de synchronisation
- Consulter les tables MySQL directement
