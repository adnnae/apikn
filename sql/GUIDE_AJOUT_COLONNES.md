# 📋 GUIDE: Ajout des colonnes d'informations de société

## ⚠️ PROBLÈME RENCONTRÉ

L'erreur `Syntax error near 'IF NOT EXISTS'` indique que votre version de MySQL ne supporte pas cette syntaxe dans `ALTER TABLE ADD COLUMN`.

---

## ✅ SOLUTION: Utiliser le script corrigé

### OPTION 1: Script simple (recommandé si la table est vide)

**Fichier:** `add_company_info_to_users_fixed.sql`

**Étapes:**
1. Ouvrez Adminer (votre interface MySQL actuelle)
2. Sélectionnez la base de données **default_db** (en haut à gauche)
3. Cliquez sur **"Requête SQL"** dans le menu
4. Copiez-collez le contenu de `add_company_info_to_users_fixed.sql`
5. Cliquez sur **"Exécuter"**

**Note:** Si certaines colonnes existent déjà, vous aurez des erreurs "Duplicate column name". C'est normal, passez à l'option 2.

---

### OPTION 2: Ajout colonne par colonne (si certaines colonnes existent déjà)

Exécutez les commandes **UNE PAR UNE** dans Adminer:

```sql
-- 1. Informations de base
ALTER TABLE users ADD COLUMN nomSociete VARCHAR(255) NULL COMMENT 'Nom de la société';
```

Si vous avez l'erreur "Duplicate column name 'nomSociete'", c'est que la colonne existe déjà. Passez à la suivante.

```sql
ALTER TABLE users ADD COLUMN raisonSociale VARCHAR(255) NULL COMMENT 'Raison sociale';
ALTER TABLE users ADD COLUMN telephone VARCHAR(50) NULL COMMENT 'Téléphone principal';
ALTER TABLE users ADD COLUMN telephone2 VARCHAR(50) NULL COMMENT 'Téléphone secondaire';
ALTER TABLE users ADD COLUMN fixe VARCHAR(50) NULL COMMENT 'Téléphone fixe';
ALTER TABLE users ADD COLUMN fax VARCHAR(50) NULL COMMENT 'Numéro de fax';
```

```sql
-- 2. Adresse
ALTER TABLE users ADD COLUMN ville VARCHAR(100) NULL COMMENT 'Ville';
ALTER TABLE users ADD COLUMN adresseComplete TEXT NULL COMMENT 'Adresse complète';
```

```sql
-- 3. Informations légales
ALTER TABLE users ADD COLUMN ice VARCHAR(50) NULL COMMENT 'ICE';
ALTER TABLE users ADD COLUMN rc VARCHAR(50) NULL COMMENT 'RC';
ALTER TABLE users ADD COLUMN if_ VARCHAR(50) NULL COMMENT 'IF';
ALTER TABLE users ADD COLUMN cnss VARCHAR(50) NULL COMMENT 'CNSS';
```

```sql
-- 4. Informations bancaires
ALTER TABLE users ADD COLUMN banque VARCHAR(100) NULL COMMENT 'Nom de la banque';
ALTER TABLE users ADD COLUMN codeBanque VARCHAR(50) NULL COMMENT 'Code banque';
ALTER TABLE users ADD COLUMN compteBanque VARCHAR(100) NULL COMMENT 'Compte bancaire';
```

```sql
-- 5. Autres informations
ALTER TABLE users ADD COLUMN activite VARCHAR(255) NULL COMMENT 'Activité';
ALTER TABLE users ADD COLUMN texte TEXT NULL COMMENT 'Texte personnalisé';
```

```sql
-- 6. Images (logo et cachet)
ALTER TABLE users ADD COLUMN logoBase64 LONGTEXT NULL COMMENT 'Logo en base64';
ALTER TABLE users ADD COLUMN signatureCachetBase64 LONGTEXT NULL COMMENT 'Cachet en base64';
```

```sql
-- 7. Configuration
ALTER TABLE users ADD COLUMN devise VARCHAR(10) DEFAULT 'MAD' COMMENT 'Devise';
ALTER TABLE users ADD COLUMN langue VARCHAR(10) DEFAULT 'fr' COMMENT 'Langue';
ALTER TABLE users ADD COLUMN configurationTerminee TINYINT(1) DEFAULT 0 COMMENT 'Config terminée';
```

---

### OPTION 3: Vérifier d'abord les colonnes manquantes

**Fichier:** `check_and_add_company_columns.sql`

**Étapes:**
1. Exécutez `check_and_add_company_columns.sql` dans Adminer
2. Notez quelles colonnes sont manquantes
3. Ajoutez uniquement les colonnes manquantes avec l'option 2

---

## 🔍 VÉRIFICATION

Après avoir ajouté les colonnes, vérifiez qu'elles existent:

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN (
    'nomSociete', 'raisonSociale', 'telephone', 'telephone2', 
    'fixe', 'fax', 'ville', 'adresseComplete', 'ice', 'rc', 'if_', 
    'cnss', 'banque', 'codeBanque', 'compteBanque', 'activite', 'texte',
    'logoBase64', 'signatureCachetBase64', 'devise', 'langue', 'configurationTerminee'
  )
ORDER BY COLUMN_NAME;
```

**Résultat attendu:** 22 lignes (une pour chaque colonne)

---

## 📊 STRUCTURE FINALE DE LA TABLE users

Après l'exécution du script, votre table `users` devrait avoir ces colonnes:

| Colonne | Type | Description |
|---------|------|-------------|
| id | INT | ID utilisateur (existant) |
| username | VARCHAR | Nom d'utilisateur (existant) |
| email | VARCHAR | Email utilisateur (existant) |
| password | VARCHAR | Mot de passe (existant) |
| role | VARCHAR | Rôle (existant) |
| **nomSociete** | VARCHAR(255) | Nom de la société |
| **raisonSociale** | VARCHAR(255) | Raison sociale |
| **telephone** | VARCHAR(50) | Téléphone principal |
| **telephone2** | VARCHAR(50) | Téléphone secondaire |
| **fixe** | VARCHAR(50) | Téléphone fixe |
| **fax** | VARCHAR(50) | Numéro de fax |
| **ville** | VARCHAR(100) | Ville |
| **adresseComplete** | TEXT | Adresse complète |
| **ice** | VARCHAR(50) | ICE |
| **rc** | VARCHAR(50) | Registre de Commerce |
| **if_** | VARCHAR(50) | Identifiant Fiscal |
| **cnss** | VARCHAR(50) | Numéro CNSS |
| **banque** | VARCHAR(100) | Nom de la banque |
| **codeBanque** | VARCHAR(50) | Code de la banque |
| **compteBanque** | VARCHAR(100) | Compte bancaire |
| **activite** | VARCHAR(255) | Activité |
| **texte** | TEXT | Texte personnalisé |
| **logoBase64** | LONGTEXT | Logo en base64 |
| **signatureCachetBase64** | LONGTEXT | Cachet en base64 |
| **devise** | VARCHAR(10) | Code devise (MAD, EUR, USD) |
| **langue** | VARCHAR(10) | Code langue (fr, en, ar) |
| **configurationTerminee** | TINYINT(1) | Configuration terminée |

---

## 🎯 PROCHAINES ÉTAPES

Une fois les colonnes ajoutées:

1. ✅ Vérifiez que les colonnes existent (requête ci-dessus)
2. ✅ Ajoutez les routes API dans `server.js` (voir `ROUTES_COMPANY_INFO.md`)
3. ✅ Modifiez `settings_screen.dart` pour utiliser l'API
4. ✅ Testez l'enregistrement des informations depuis l'interface

---

## ❓ FAQ

### Q: J'ai l'erreur "Duplicate column name"
**R:** La colonne existe déjà. Passez à la colonne suivante.

### Q: J'ai l'erreur "Unknown column 'email' in 'field list'"
**R:** La colonne `email` existe déjà dans votre table users. C'est normal, ne l'ajoutez pas.

### Q: Combien de colonnes dois-je ajouter?
**R:** 22 nouvelles colonnes (voir tableau ci-dessus)

### Q: Puis-je exécuter le script plusieurs fois?
**R:** Non, vous aurez des erreurs "Duplicate column name". Utilisez l'option 2 pour ajouter uniquement les colonnes manquantes.

### Q: Comment supprimer une colonne si je me suis trompé?
**R:** `ALTER TABLE users DROP COLUMN nom_colonne;`

---

**Date:** 21 décembre 2024  
**Fichiers:**
- `add_company_info_to_users_fixed.sql` - Script corrigé
- `check_and_add_company_columns.sql` - Vérification
- `GUIDE_AJOUT_COLONNES.md` - Ce guide
