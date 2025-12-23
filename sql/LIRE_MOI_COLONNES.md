# 📋 AJOUT DES COLONNES - INSTRUCTIONS RAPIDES

## ⚡ MÉTHODE RAPIDE (2 minutes)

### 1. Ouvrez Adminer
Vous êtes déjà dessus: `212.192.3.44` → **default_db**

### 2. Cliquez sur "Requête SQL"
Dans le menu en haut

### 3. Copiez-collez ce script:

```sql
ALTER TABLE users ADD COLUMN nomSociete VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN raisonSociale VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN telephone VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN telephone2 VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN fixe VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN fax VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN ville VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN adresseComplete TEXT NULL;
ALTER TABLE users ADD COLUMN ice VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN rc VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN if_ VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN cnss VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN banque VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN codeBanque VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN compteBanque VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN activite VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN texte TEXT NULL;
ALTER TABLE users ADD COLUMN logoBase64 LONGTEXT NULL;
ALTER TABLE users ADD COLUMN signatureCachetBase64 LONGTEXT NULL;
ALTER TABLE users ADD COLUMN devise VARCHAR(10) DEFAULT 'MAD';
ALTER TABLE users ADD COLUMN langue VARCHAR(10) DEFAULT 'fr';
ALTER TABLE users ADD COLUMN configurationTerminee TINYINT(1) DEFAULT 0;
```

### 4. Cliquez sur "Exécuter"

### 5. Vérifiez que ça a marché:

```sql
SELECT COUNT(*) as nb_colonnes 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN (
    'nomSociete','raisonSociale','telephone','telephone2','fixe','fax',
    'ville','adresseComplete','ice','rc','if_','cnss','banque','codeBanque',
    'compteBanque','activite','texte','logoBase64','signatureCachetBase64',
    'devise','langue','configurationTerminee'
  );
```

**Résultat attendu:** `nb_colonnes = 22`

---

## ⚠️ SI VOUS AVEZ DES ERREURS

### Erreur: "Duplicate column name 'nomSociete'"
→ La colonne existe déjà, c'est normal. Continuez avec les autres.

### Erreur: "Unknown column 'email'"
→ La colonne `email` existe déjà dans users, ne l'ajoutez pas.

### Solution: Ajoutez les colonnes une par une
Copiez-collez chaque ligne `ALTER TABLE` séparément et exécutez-les une par une.

---

## ✅ C'EST FAIT!

Une fois les colonnes ajoutées:

1. **Redémarrez le serveur Node.js** (pour qu'il prenne en compte les nouvelles colonnes)
2. **Ajoutez les routes API** (voir `ROUTES_COMPANY_INFO.md`)
3. **Testez depuis l'interface** (Paramètres → Informations de société)

---

## 📁 FICHIERS DISPONIBLES

- **SCRIPT_SIMPLE.sql** ⭐ - Script à copier-coller (recommandé)
- **add_company_info_to_users_fixed.sql** - Script complet avec commentaires
- **check_and_add_company_columns.sql** - Vérifier les colonnes manquantes
- **GUIDE_AJOUT_COLONNES.md** - Guide détaillé
- **ROUTES_COMPANY_INFO.md** - Routes API à ajouter ensuite

---

**Temps estimé:** 2-3 minutes  
**Difficulté:** ⭐ Très facile
