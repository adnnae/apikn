# 🔐 Implémentation JWT - Guide Complet

## ✅ Ce qui a été créé

### 1. Infrastructure Backend

#### Fichiers créés:
- ✅ `middleware/auth.js` - Middleware JWT pour vérifier les tokens
- ✅ `routes/auth.js` - Routes d'authentification (login, register, etc.)
- ✅ `create_admin_user.js` - Script pour créer/mettre à jour l'utilisateur admin
- ✅ `test_auth.js` - Script de test automatisé pour l'authentification
- ✅ `sql/create_users_and_add_userId.sql` - Script SQL pour créer la table users
- ✅ `sql/fix_missing_userId_tables.sql` - Script SQL de correction
- ✅ `INTEGRATION_JWT_SERVER.md` - Guide d'intégration dans server.js
- ✅ `USERID_SETUP_COMPLETE.md` - Documentation de la configuration userId
- ✅ `JWT_IMPLEMENTATION_COMPLETE.md` - Ce document

#### Packages installés:
- ✅ `jsonwebtoken` - Génération et vérification des JWT
- ✅ `bcryptjs` - Hashage des mots de passe
- ✅ `axios` - Pour les tests HTTP

### 2. Base de Données

#### Table users créée:
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100),
  prenom VARCHAR(100),
  telephone VARCHAR(20),
  adresse TEXT,
  role ENUM('admin', 'user', 'manager') DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Colonne userId ajoutée à 14 tables:
- achats
- categories
- clients
- depenses
- fournisseurs
- lignes_achat
- lignes_retour_achat
- lignes_retour_vente
- lignes_vente
- produits
- retours_achats
- retours_ventes
- sync_metadata
- ventes

#### Utilisateur admin créé:
- Username: `admin`
- Password: `admin123` (⚠️ à changer en production!)
- Email: `admin@knachsoft.com`
- Role: `admin`
- ID: `1`

---

## 🚀 Prochaines Étapes

### Étape 1: Intégrer l'authentification dans server.js

Suivez le guide: `INTEGRATION_JWT_SERVER.md`

**Résumé:**
1. Ajouter les imports en haut de server.js
2. Initialiser le pool pour les routes auth
3. Ajouter les routes `/api/auth/*` (NON protégées)
4. Protéger TOUTES les routes existantes avec `authMiddleware`
5. Filtrer tous les SELECT par `userId`
6. Ajouter `userId` dans tous les INSERT
7. Vérifier `userId` dans tous les UPDATE/DELETE

### Étape 2: Tester l'authentification

```bash
# Démarrer le serveur
node server.js

# Dans un autre terminal, lancer les tests
node test_auth.js
```

**Résultat attendu:** 10/10 tests passés ✅

### Étape 3: Tester manuellement

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copier le token reçu

# 2. Tester une route protégée
curl -X GET http://localhost:4000/api/clients \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"

# 3. Créer un client (avec token)
curl -X POST http://localhost:4000/api/clients \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test Client","telephone":"0612345678"}'
```

### Étape 4: Mettre à jour l'application Flutter

Créer les fichiers suivants dans Flutter:

1. **`lib/services/auth_service.dart`** - Service d'authentification
2. **`lib/screens/login_screen.dart`** - Écran de connexion
3. **`lib/models/user.dart`** - Modèle utilisateur
4. **Intercepteur HTTP** - Ajouter automatiquement le token JWT

---

## 📋 Routes d'Authentification Disponibles

### POST /api/auth/register
Créer un nouvel utilisateur

**Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "nom": "Nom",
  "prenom": "Prénom",
  "telephone": "0612345678"
}
```

**Response:**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 2,
    "username": "newuser",
    "email": "user@example.com",
    "nom": "Nom",
    "prenom": "Prénom",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Se connecter

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@knachsoft.com",
    "nom": "Administrateur",
    "prenom": "Système",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/refresh
Rafraîchir le token

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Token rafraîchi",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Obtenir les informations de l'utilisateur connecté

**Headers:**
```
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@knachsoft.com",
    "nom": "Administrateur",
    "prenom": "Système",
    "telephone": null,
    "adresse": null,
    "role": "admin",
    "isActive": true,
    "createdAt": "2025-12-20T16:02:15.000Z",
    "lastLogin": "2025-12-20T17:30:00.000Z"
  }
}
```

### PUT /api/auth/profile
Mettre à jour le profil

**Headers:**
```
Authorization: Bearer TOKEN
```

**Body:**
```json
{
  "nom": "Nouveau Nom",
  "prenom": "Nouveau Prénom",
  "telephone": "0612345678",
  "adresse": "123 Rue Example",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "newemail@example.com",
    "nom": "Nouveau Nom",
    "prenom": "Nouveau Prénom",
    "telephone": "0612345678",
    "adresse": "123 Rue Example",
    "role": "admin"
  }
}
```

### PUT /api/auth/password
Changer le mot de passe

**Headers:**
```
Authorization: Bearer TOKEN
```

**Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Mot de passe changé avec succès"
}
```

### POST /api/auth/logout
Se déconnecter (optionnel - géré côté client)

**Headers:**
```
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "message": "Déconnexion réussie"
}
```

---

## 🔒 Sécurité

### Token JWT
- **Durée de vie:** 24 heures
- **Algorithme:** HS256
- **Secret:** Défini dans `.env` (JWT_SECRET)

### Refresh Token
- **Durée de vie:** 7 jours
- **Usage:** Obtenir un nouveau token sans se reconnecter

### Mot de passe
- **Hashage:** bcrypt avec 10 rounds
- **Minimum:** 6 caractères

### Protection des routes
- Toutes les routes (sauf `/api/health` et `/api/auth/*`) nécessitent un token JWT
- Chaque utilisateur ne voit que ses propres données (filtrage par `userId`)
- Impossible d'accéder aux données d'un autre utilisateur

---

## 🧪 Tests

### Test automatisé
```bash
node test_auth.js
```

**Tests effectués:**
1. ✅ Login avec admin
2. ✅ Login avec mauvais mot de passe (doit échouer)
3. ✅ Récupérer les infos utilisateur
4. ✅ Accès sans token (doit échouer)
5. ✅ Créer un nouvel utilisateur
6. ✅ Créer un utilisateur avec username existant (doit échouer)
7. ✅ Rafraîchir le token
8. ✅ Mettre à jour le profil
9. ✅ Accéder à une route protégée avec token
10. ✅ Accéder à une route protégée sans token (doit échouer)

### Test manuel avec Postman/Insomnia

1. **Créer une collection "KnachSoft Auth"**
2. **Ajouter les requêtes ci-dessus**
3. **Tester chaque endpoint**

---

## 📱 Intégration Flutter (À faire)

### 1. Créer le service d'authentification

```dart
// lib/services/auth_service.dart
class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'user_data';
  
  Future<bool> login(String username, String password) async {
    // Appeler /api/auth/login
    // Sauvegarder le token dans flutter_secure_storage
    // Sauvegarder les infos utilisateur
  }
  
  Future<void> logout() async {
    // Supprimer le token
    // Supprimer les infos utilisateur
  }
  
  Future<String?> getToken() async {
    // Récupérer le token depuis flutter_secure_storage
  }
  
  Future<bool> isLoggedIn() async {
    // Vérifier si un token existe et est valide
  }
}
```

### 2. Créer l'écran de connexion

```dart
// lib/screens/login_screen.dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  
  Future<void> _login() async {
    final success = await AuthService().login(
      _usernameController.text,
      _passwordController.text,
    );
    
    if (success) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Afficher erreur
    }
  }
  
  @override
  Widget build(BuildContext context) {
    // UI de connexion
  }
}
```

### 3. Créer un intercepteur HTTP

```dart
// lib/services/http_interceptor.dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await AuthService().getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
  
  @override
  void onError(DioError err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expiré, essayer de refresh
      // Ou rediriger vers login
    }
    handler.next(err);
  }
}
```

### 4. Mettre à jour main.dart

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final isLoggedIn = await AuthService().isLoggedIn();
  
  runApp(MyApp(
    initialRoute: isLoggedIn ? '/home' : '/login',
  ));
}
```

---

## 📊 Architecture Finale

```
┌─────────────────────────────────────────────────────────┐
│                  Flutter App                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ LoginScreen                                       │  │
│  │ - Username/Password                               │  │
│  │ - Appelle AuthService.login()                     │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ AuthService                                       │  │
│  │ - Stocke JWT token (flutter_secure_storage)      │  │
│  │ - Gère login/logout                               │  │
│  │ - Auto-refresh du token                           │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ HTTP Interceptor                                  │  │
│  │ - Ajoute "Authorization: Bearer TOKEN"           │  │
│  │ - Gère les erreurs 401 (token expiré)            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP + JWT Token
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js API (Port 4000)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Routes Auth (NON protégées)                       │  │
│  │ - POST /api/auth/login                            │  │
│  │ - POST /api/auth/register                         │  │
│  │ - POST /api/auth/refresh                          │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Auth Middleware                                   │  │
│  │ - Vérifie JWT token                               │  │
│  │ - Extrait userId                                  │  │
│  │ - Rejette si invalide (401)                       │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Routes Protégées                                  │  │
│  │ - GET /api/clients (filtre par userId)           │  │
│  │ - POST /api/ventes (ajoute userId)               │  │
│  │ - PUT /api/produits/:id (vérifie userId)         │  │
│  │ - DELETE /api/achats/:id (vérifie userId)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  MySQL Database                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ users (table)                                     │  │
│  │ - id, username, email, password, role             │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Toutes les autres tables                          │  │
│  │ - clients (userId FK)                             │  │
│  │ - produits (userId FK)                            │  │
│  │ - ventes (userId FK)                              │  │
│  │ - achats (userId FK)                              │  │
│  │ - etc.                                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Finale

### Backend
- [x] Table `users` créée
- [x] Colonne `userId` ajoutée à toutes les tables
- [x] Utilisateur admin créé
- [x] Middleware JWT créé (`middleware/auth.js`)
- [x] Routes auth créées (`routes/auth.js`)
- [x] Packages installés (jsonwebtoken, bcryptjs, axios)
- [x] Script de test créé (`test_auth.js`)
- [x] Documentation créée
- [ ] Routes protégées dans `server.js` (À FAIRE)
- [ ] Tests passés (10/10)

### Frontend (À FAIRE)
- [ ] Service d'authentification créé
- [ ] Écran de connexion créé
- [ ] Intercepteur HTTP créé
- [ ] Stockage sécurisé du token
- [ ] Gestion de l'expiration du token
- [ ] Tests d'intégration

---

## 🎯 Prochaine Action Immédiate

**Mettre à jour `server.js` en suivant le guide `INTEGRATION_JWT_SERVER.md`**

Ensuite, lancer les tests:
```bash
node test_auth.js
```

Une fois les tests passés, passer à l'intégration Flutter.

---

**Date:** 20 Décembre 2025  
**Status:** ✅ Infrastructure JWT créée - En attente d'intégration dans server.js  
**Prochaine étape:** Protéger les routes dans server.js
