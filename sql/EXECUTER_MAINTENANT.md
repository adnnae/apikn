# ⚡ À EXÉCUTER MAINTENANT

## 📋 RÉSULTAT DE LA VÉRIFICATION

Votre table `users` a actuellement **13 colonnes**.

**Colonnes manquantes:** 21 colonnes à ajouter

**Note:** La colonne `telephone` existe déjà, donc on ne l'ajoute pas.

---

## ✅ ÉTAPE 1: Copier le script

Ouvrez le fichier **`AJOUTER_COLONNES_MANQUANTES.sql`** et copiez tout son contenu.

---

## ✅ ÉTAPE 2: Exécuter dans Adminer

1. Dans Adminer, cliquez sur **"Requête SQL"**
2. **Collez** le script copié
3. Cliquez sur **"Exécuter"**

---

## ✅ ÉTAPE 3: Vérifier le résultat

Vous devriez voir:
- `✅ Script exécuté avec succès!`
- `colonnes_ajoutees = 21`
- Liste de toutes les colonnes de la table users (34 colonnes au total)

---

## 📊 COLONNES QUI SERONT AJOUTÉES

### Informations de base (5 colonnes)
- nomSociete
- raisonSociale
- telephone2
- fixe
- fax

### Adresse (2 colonnes)
- ville
- adresseComplete

### Informations légales (4 colonnes)
- ice
- rc
- if_
- cnss

### Informations bancaires (3 colonnes)
- banque
- codeBanque
- compteBanque

### Autres (2 colonnes)
- activite
- texte

### Images (2 colonnes)
- logoBase64
- signatureCachetBase64

### Configuration (3 colonnes)
- devise (défaut: 'MAD')
- langue (défaut: 'fr')
- configurationTerminee (défaut: 0)

**TOTAL: 21 colonnes**

---

## 🎯 APRÈS L'EXÉCUTION

Une fois les colonnes ajoutées:

1. ✅ Les colonnes sont prêtes dans MySQL
2. ✅ Consultez **`ROUTES_COMPANY_INFO.md`** pour ajouter les routes API
3. ✅ Modifiez `settings_screen.dart` pour utiliser l'API
4. ✅ Testez depuis l'interface "Paramètres"

---

**Temps estimé:** 1 minute  
**Fichier à exécuter:** `AJOUTER_COLONNES_MANQUANTES.sql`
