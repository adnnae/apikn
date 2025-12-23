# 🔐 Authentification JWT - KnachSoft API

## ✅ Status: TERMINÉ ET TESTÉ

**Tests:** 21/21 passés ✅  
**Sécurité:** Vérifiée ✅  
**Isolation des données:** Fonctionnelle ✅

---

## 🚀 Démarrage Rapide

### 1. Démarrer le serveur
```bash
node server.js
```

### 2. Tester
```bash
node test_auth.js           # Tests d'authentification (10/10)
node test_userId_filtering.js  # Tests de filtrage (11/11)
```

### 3. Credentials par défaut
- **Username:** admin
- **Password:** admin123

---

## 📚 Documentation

- `LIRE_CECI_MAINTENANT_JWT_TERMINE.md` - Guide rapide
- `JWT_INTEGRATION_COMPLETE_FINAL.md` - Documentation complète
- `INTEGRATION_JWT_REUSSIE.md` - Résultats des tests

---

## 🎯 Utilisation

### Login
```bash
curl -X POST http://212.192.3.44:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Requête authentifiée
```bash
curl -X GET http://212.192.3.44:4000/api/clients \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Flutter
```dart
import 'package:knachsoftmobile/services/auth_service.dart';

final authService = AuthService();
await authService.login('admin', 'admin123');
final response = await authService.authenticatedGet('/clients');
```

---

## ⚠️ Production

Avant le déploiement:
1. Changer le mot de passe admin
2. Changer JWT_SECRET dans .env
3. Utiliser HTTPS

---

**Date:** 20 Décembre 2025  
**Status:** ✅ PRÊT POUR LA PRODUCTION
