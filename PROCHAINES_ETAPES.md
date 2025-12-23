# ✅ Routes API Retours Ajoutées !

## Ce qui a été fait

Les routes API pour les retours de vente et d'achat ont été ajoutées dans `server.js` :

### Routes Retours Ventes
- `GET /api/retours_ventes` - Liste tous les retours de vente
- `GET /api/retours_ventes/:id` - Récupère un retour spécifique
- `POST /api/retours_ventes` - Crée un nouveau retour
- `PUT /api/retours_ventes/:id` - Met à jour un retour
- `DELETE /api/retours_ventes/:id` - Supprime un retour (et ses lignes)

### Routes Retours Achats
- `GET /api/retours_achats` - Liste tous les retours d'achat
- `GET /api/retours_achats/:id` - Récupère un retour spécifique
- `POST /api/retours_achats` - Crée un nouveau retour
- `PUT /api/retours_achats/:id` - Met à jour un retour
- `DELETE /api/retours_achats/:id` - Supprime un retour (et ses lignes)

## 🚀 Prochaines étapes

### 1. Créer les tables MySQL (OBLIGATOIRE)

Vous devez exécuter le script SQL pour créer les 4 tables nécessaires :

**Option A : Via phpMyAdmin ou MySQL Workbench**
1. Ouvrez votre client MySQL
2. Sélectionnez votre base de données
3. Copiez et exécutez le contenu du fichier :
   ```
   knachsoftmobile/API_RETOURS/sql/create_tables_retours.sql
   ```

**Option B : En ligne de commande**
```bash
cd "C:\Users\ad\Desktop\knachsoft-api - Copie"
mysql -u votre_user -p votre_database < ../knachsoftmobile/API_RETOURS/sql/create_tables_retours.sql
```

### 2. Redémarrer le serveur Node.js

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
npm start
```

### 3. Tester les endpoints

```bash
# Test 1 : Vérifier que l'API répond
curl http://localhost:4000/api/retours_ventes

# Test 2 : Vérifier les retours d'achat
curl http://localhost:4000/api/retours_achats

# Les deux devraient retourner : []
```

## 📋 Tables créées

Le script SQL crée 4 tables :

1. **retours_ventes** - Retours de vente (en-tête)
2. **retours_achats** - Retours d'achat (en-tête)
3. **lignes_retour_vente** - Détails des produits retournés (vente)
4. **lignes_retour_achat** - Détails des produits retournés (achat)

## ✅ Synchronisation Flutter

L'application Flutter est déjà configurée pour synchroniser les retours :
- `lib/services/mysql_sync_service.dart` - Contient les endpoints
- `lib/utils/delta_sync_helper.dart` - Gère la synchronisation
- `lib/screens/new_retour_vente_screen.dart` - Écran de création
- `lib/screens/new_retour_achat_screen.dart` - Écran de création

Une fois les tables créées et le serveur redémarré, la synchronisation fonctionnera automatiquement !

## 🆘 En cas de problème

Si vous avez une erreur :
1. Vérifiez que les tables sont bien créées dans MySQL
2. Vérifiez que le serveur a bien redémarré
3. Consultez les logs du serveur pour voir l'erreur exacte
4. Vérifiez que votre fichier `.env` contient les bonnes informations de connexion MySQL

## 📁 Fichiers de référence

- `knachsoftmobile/API_RETOURS/sql/create_tables_retours.sql` - Script SQL
- `knachsoftmobile/API_RETOURS/GUIDE_INSTALLATION_RAPIDE.md` - Guide détaillé
- `knachsoft-api - Copie/server.js` - Serveur avec les nouvelles routes
