# 🏢 PARAMÈTRES DE SOCIÉTÉ - IMPLÉMENTATION COMPLÈTE

## ✅ TRAVAIL EFFECTUÉ

### 1. Scripts SQL créés ✅
- `sql/AJOUTER_COLONNES_MANQUANTES.sql` - Ajoute 21 colonnes à la table users
- `sql/check_and_add_company_columns.sql` - Vérifie les colonnes manquantes
- `sql/EXECUTER_MAINTENANT.md` - Guide d'exécution
- `sql/LIRE_MOI_COLONNES.md` - Instructions rapides

### 2. Routes API ajoutées dans server.js ✅
- `GET /api/users/company-info` - Récupérer les informations
- `PUT /api/users/company-info` - Mettre à jour les informations
- `PUT /api/users/logo` - Mettre à jour le logo
- `PUT /api/users/signature` - Mettre à jour le cachet/signature
- `DELETE /api/users/logo` - Supprimer le logo
- `DELETE /api/users/signature` - Supprimer le cachet/signature

### 3. Documentation créée ✅
- `ROUTES_COMPANY_INFO.md` - Documentation des routes API
- `MODIFICATION_SETTINGS_SCREEN.md` - Guide de modification de settings_screen.dart

---

## 🎯 ÉTAPES À SUIVRE MAINTENANT

### ÉTAPE 1: Exécuter le script SQL ⚡

1. **Ouvrez Adminer** (vous y êtes déjà)
2. **Sélectionnez la base `default_db`**
3. **Cliquez sur "Requête SQL"**
4. **Ouvrez le fichier** `sql/AJOUTER_COLONNES_MANQUANTES.sql`
5. **Copiez tout le contenu**
6. **Collez dans Adminer**
7. **Cliquez sur "Exécuter"**

**Résultat attendu:**
```
✅ Script exécuté avec succès!
colonnes_ajoutees = 21
```

---

### ÉTAPE 2: Redémarrer le serveur Node.js 🔄

```cmd
# Arrêter le serveur
taskkill /IM node.exe /F

# Redémarrer
cd "knachsoft-api - Copie"
npm start
```

**Résultat attendu:**
```
✅ API MySQL démarrée sur http://localhost:4000
✅ Connecté à MySQL
```

---

### ÉTAPE 3: Modifier settings_screen.dart 📝

Suivez les instructions dans **`MODIFICATION_SETTINGS_SCREEN.md`**:

1. Ajouter les imports
2. Ajouter la constante `_apiBaseUrl`
3. Remplacer `_loadSettings()`
4. Remplacer `_saveSettings()`
5. Ajouter `_fillControllersFromSettings()`

---

### ÉTAPE 4: Tester l'application 🧪

1. **Hot reload Flutter** (appuyez sur `R`)
2. **Ouvrez la console du navigateur** (F12)
3. **Allez dans "Paramètres"**
4. **Remplissez les informations de société**
5. **Cliquez sur "Enregistrer"**

**Logs attendus dans la console:**
```
📊 [SETTINGS] Réponse API: 200
✅ [SETTINGS] Informations chargées depuis MySQL
📊 [SETTINGS] Réponse sauvegarde: 200
✅ [SETTINGS] Informations sauvegardées dans MySQL
```

---

## 📊 COLONNES AJOUTÉES À LA TABLE users

### Informations de base (5)
- nomSociete
- raisonSociale
- telephone2
- fixe
- fax

### Adresse (2)
- ville
- adresseComplete

### Informations légales (4)
- ice (ICE)
- rc (Registre de Commerce)
- if_ (Identifiant Fiscal)
- cnss (CNSS)

### Informations bancaires (3)
- banque
- codeBanque
- compteBanque

### Autres (2)
- activite
- texte

### Images (2)
- logoBase64 (LONGTEXT)
- signatureCachetBase64 (LONGTEXT)

### Configuration (3)
- devise (défaut: 'MAD')
- langue (défaut: 'fr')
- configurationTerminee (défaut: 0)

**TOTAL: 21 colonnes**

---

## 🔍 ROUTES API DISPONIBLES

### GET /api/users/company-info
**Description:** Récupère les informations de société de l'utilisateur connecté

**Headers:** `Authorization: Bearer <token>`

**Réponse:**
```json
{
  "id": 1,
  "username": "admin",
  "nomSociete": "Ma Société",
  "raisonSociale": "Ma Société SARL",
  "telephone": "0612345678",
  "ville": "Casablanca",
  "logoBase64": "data:image/png;base64,...",
  "devise": "MAD",
  "langue": "fr"
}
```

### PUT /api/users/company-info
**Description:** Met à jour les informations de société

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Body:**
```json
{
  "nomSociete": "Ma Société",
  "raisonSociale": "Ma Société SARL",
  "telephone": "0612345678",
  "ville": "Casablanca",
  "devise": "MAD",
  "langue": "fr"
}
```

### PUT /api/users/logo
**Description:** Met à jour le logo

**Body:**
```json
{
  "logoBase64": "data:image/png;base64,..."
}
```

### PUT /api/users/signature
**Description:** Met à jour le cachet/signature

**Body:**
```json
{
  "signatureCachetBase64": "data:image/png;base64,..."
}
```

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Script SQL exécuté (21 colonnes ajoutées)
- [ ] Serveur Node.js redémarré
- [ ] Routes API testées (GET /api/users/company-info)
- [ ] settings_screen.dart modifié
- [ ] Application Flutter rechargée (hot reload)
- [ ] Paramètres testés depuis l'interface
- [ ] Logo uploadé et sauvegardé
- [ ] Cachet uploadé et sauvegardé
- [ ] Informations affichées correctement après rechargement

---

## 🐛 DÉPANNAGE

### Erreur: "Unknown column 'nomSociete'"
→ Le script SQL n'a pas été exécuté. Exécutez `AJOUTER_COLONNES_MANQUANTES.sql`

### Erreur 401 dans les logs
→ Token JWT invalide. Déconnectez-vous et reconnectez-vous

### Erreur: "Cannot connect to MySQL server"
→ Le serveur Node.js n'est pas démarré. Exécutez `npm start`

### Les paramètres ne se sauvegardent pas
→ Vérifiez les logs dans la console (F12) pour voir l'erreur exacte

### Le logo ne s'affiche pas
→ Vérifiez que l'image est bien encodée en base64 et que la taille est raisonnable (<2MB)

---

## 📁 FICHIERS CRÉÉS

### SQL
- `sql/AJOUTER_COLONNES_MANQUANTES.sql`
- `sql/check_and_add_company_columns.sql`
- `sql/EXECUTER_MAINTENANT.md`
- `sql/LIRE_MOI_COLONNES.md`
- `sql/GUIDE_AJOUT_COLONNES.md`
- `sql/SCRIPT_SIMPLE.sql`

### Documentation
- `ROUTES_COMPANY_INFO.md`
- `MODIFICATION_SETTINGS_SCREEN.md`
- `PARAMETRES_SOCIETE_COMPLET.md` (ce fichier)

### Code
- `server.js` - Routes API ajoutées (6 routes)

---

## 🎉 RÉSULTAT FINAL

Une fois toutes les étapes complétées:

1. ✅ Chaque utilisateur peut enregistrer ses informations de société dans MySQL
2. ✅ Les informations sont liées à l'utilisateur connecté (via JWT)
3. ✅ Le logo et le cachet sont stockés en base64 dans MySQL
4. ✅ Les paramètres sont chargés automatiquement au démarrage
5. ✅ Les modifications sont sauvegardées en temps réel
6. ✅ Fallback WebStorage en cas d'erreur API

---

**Date:** 21 décembre 2024  
**Temps estimé:** 15-20 minutes  
**Difficulté:** ⭐⭐ Moyenne
