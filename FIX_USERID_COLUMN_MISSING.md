# FIX: Colonne userId manquante dans les tables lignes_retour

## 🔴 Problème identifié

Lors de la création d'un retour vente ou achat, l'erreur suivante apparaît:
```
Exception: Error in CREATE /api/lignes_retour_vente: value '9500'; 
["error: Unknown column 'userId' in 'field list'"]
```

## 🔍 Cause

Les tables `lignes_retour_vente` et `lignes_retour_achat` dans MySQL n'ont pas la colonne `userId`, mais les routes API essaient d'insérer cette colonne.

## ✅ Solution appliquée

### 1. Script de correction immédiate

Créé: `fix_add_userId_column.js`

Ce script ajoute la colonne `userId` aux tables existantes:

```bash
cd "c:\Users\ad\Desktop\knachsoft-api - Copie"
node fix_add_userId_column.js
```

### 2. Mise à jour du script de création

Modifié: `create_tables_retours.js`

Les tables `lignes_retour_vente` et `lignes_retour_achat` incluent maintenant:
- Colonne `userId INT NOT NULL DEFAULT 1`
- Index sur `userId` pour les performances

## 📋 Étapes pour corriger votre base de données

### Option A: Ajouter la colonne aux tables existantes (RECOMMANDÉ)

```bash
cd "c:\Users\ad\Desktop\knachsoft-api - Copie"
node fix_add_userId_column.js
```

### Option B: Recréer les tables (⚠️ PERTE DE DONNÉES)

Si vous n'avez pas de données importantes:

```sql
DROP TABLE IF EXISTS lignes_retour_vente;
DROP TABLE IF EXISTS lignes_retour_achat;
```

Puis:
```bash
node create_tables_retours.js
```

## 🧪 Test après correction

1. Redémarrez votre serveur API
2. Essayez de créer un nouveau retour vente ou achat
3. Vérifiez dans l'historique de synchronisation

## 📊 Structure finale des tables

### lignes_retour_vente
```sql
CREATE TABLE lignes_retour_vente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL DEFAULT 1,          -- ✅ AJOUTÉ
  retourVenteId INT NOT NULL,
  produitId INT NOT NULL,
  quantite INT NOT NULL,
  prixUnitaire DECIMAL(10,2) NOT NULL,
  montantLigne DECIMAL(10,2) NOT NULL,
  deviceId VARCHAR(100),
  lastModified DATETIME,
  INDEX idx_userId (userId),              -- ✅ AJOUTÉ
  INDEX idx_retourVente (retourVenteId),
  INDEX idx_produit (produitId)
);
```

### lignes_retour_achat
```sql
CREATE TABLE lignes_retour_achat (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL DEFAULT 1,          -- ✅ AJOUTÉ
  retourAchatId INT NOT NULL,
  produitId INT NOT NULL,
  quantite INT NOT NULL,
  prixUnitaire DECIMAL(10,2) NOT NULL,
  montantLigne DECIMAL(10,2) NOT NULL,
  deviceId VARCHAR(100),
  lastModified DATETIME,
  INDEX idx_userId (userId),              -- ✅ AJOUTÉ
  INDEX idx_retourAchat (retourAchatId),
  INDEX idx_produit (produitId)
);
```

## ✅ Résultat attendu

Après correction, vous pourrez créer des retours ventes et achats sans erreur "Unknown column 'userId'".
