# 🏢 Routes API - Informations de Société

## 📋 RÉSUMÉ

Ce document décrit les routes API à ajouter dans `server.js` pour gérer les informations de société et les images (logo, cachet) pour chaque utilisateur.

---

## 🔧 ROUTES À AJOUTER

### 1. GET /api/users/company-info
**Description:** Récupérer les informations de société de l'utilisateur connecté

**Authentification:** JWT requis

**Réponse:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "nomSociete": "Ma Société",
  "raisonSociale": "Ma Société SARL",
  "telephone": "0612345678",
  "telephone2": "0687654321",
  "fixe": "0522123456",
  "fax": "0522123457",
  "ville": "Casablanca",
  "adresseComplete": "123 Rue Example, Casablanca, Maroc",
  "ice": "000123456789012",
  "rc": "RC123456",
  "if_": "IF123456",
  "cnss": "CNSS123456",
  "banque": "Banque Populaire",
  "codeBanque": "BP001",
  "compteBanque": "123456789012",
  "activite": "Commerce général",
  "texte": "Mentions légales...",
  "logoBase64": "data:image/png;base64,...",
  "signatureCachetBase64": "data:image/png;base64,...",
  "devise": "MAD",
  "langue": "fr",
  "configurationTerminee": true
}
```

---

### 2. PUT /api/users/company-info
**Description:** Mettre à jour les informations de société de l'utilisateur connecté

**Authentification:** JWT requis

**Body:**
```json
{
  "nomSociete": "Ma Société",
  "raisonSociale": "Ma Société SARL",
  "email": "contact@masociete.com",
  "telephone": "0612345678",
  "telephone2": "0687654321",
  "fixe": "0522123456",
  "fax": "0522123457",
  "ville": "Casablanca",
  "adresseComplete": "123 Rue Example, Casablanca, Maroc",
  "ice": "000123456789012",
  "rc": "RC123456",
  "if_": "IF123456",
  "cnss": "CNSS123456",
  "banque": "Banque Populaire",
  "codeBanque": "BP001",
  "compteBanque": "123456789012",
  "activite": "Commerce général",
  "texte": "Mentions légales...",
  "devise": "MAD",
  "langue": "fr",
  "configurationTerminee": true
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Informations de société mises à jour avec succès",
  "user": { ... }
}
```

---

### 3. PUT /api/users/logo
**Description:** Mettre à jour le logo de l'entreprise

**Authentification:** JWT requis

**Body:**
```json
{
  "logoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Logo mis à jour avec succès"
}
```

---

### 4. PUT /api/users/signature
**Description:** Mettre à jour le cachet/signature

**Authentification:** JWT requis

**Body:**
```json
{
  "signatureCachetBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Cachet/signature mis à jour avec succès"
}
```

---

### 5. DELETE /api/users/logo
**Description:** Supprimer le logo de l'entreprise

**Authentification:** JWT requis

**Réponse:**
```json
{
  "success": true,
  "message": "Logo supprimé avec succès"
}
```

---

### 6. DELETE /api/users/signature
**Description:** Supprimer le cachet/signature

**Authentification:** JWT requis

**Réponse:**
```json
{
  "success": true,
  "message": "Cachet/signature supprimé avec succès"
}
```

---

## 💻 CODE À AJOUTER DANS server.js

```javascript
// ==================== INFORMATIONS DE SOCIÉTÉ ====================

// GET /api/users/company-info - Récupérer les informations de société
app.get('/api/users/company-info', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, username, email, role,
        nomSociete, raisonSociale, telephone, telephone2, fixe, fax,
        ville, adresseComplete, ice, rc, if_, cnss,
        banque, codeBanque, compteBanque, activite, texte,
        logoBase64, signatureCachetBase64,
        devise, langue, configurationTerminee
      FROM users 
      WHERE id = ?`,
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération informations société:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/company-info - Mettre à jour les informations de société
app.put('/api/users/company-info', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const {
    nomSociete, raisonSociale, email, telephone, telephone2, fixe, fax,
    ville, adresseComplete, ice, rc, if_, cnss,
    banque, codeBanque, compteBanque, activite, texte,
    devise, langue, configurationTerminee
  } = req.body;
  
  try {
    await pool.query(
      `UPDATE users SET
        nomSociete = ?, raisonSociale = ?, email = ?, 
        telephone = ?, telephone2 = ?, fixe = ?, fax = ?,
        ville = ?, adresseComplete = ?, ice = ?, rc = ?, if_ = ?, cnss = ?,
        banque = ?, codeBanque = ?, compteBanque = ?, activite = ?, texte = ?,
        devise = ?, langue = ?, configurationTerminee = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [
        nomSociete, raisonSociale, email,
        telephone, telephone2, fixe, fax,
        ville, adresseComplete, ice, rc, if_, cnss,
        banque, codeBanque, compteBanque, activite, texte,
        devise, langue, configurationTerminee,
        userId
      ]
    );
    
    // Récupérer les données mises à jour
    const [rows] = await pool.query(
      `SELECT 
        id, username, email, role,
        nomSociete, raisonSociale, telephone, telephone2, fixe, fax,
        ville, adresseComplete, ice, rc, if_, cnss,
        banque, codeBanque, compteBanque, activite, texte,
        devise, langue, configurationTerminee
      FROM users 
      WHERE id = ?`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Informations de société mises à jour avec succès',
      user: rows[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour informations société:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/logo - Mettre à jour le logo
app.put('/api/users/logo', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { logoBase64 } = req.body;
  
  if (!logoBase64) {
    return res.status(400).json({ error: 'Logo requis' });
  }
  
  try {
    await pool.query(
      'UPDATE users SET logoBase64 = ?, updatedAt = NOW() WHERE id = ?',
      [logoBase64, userId]
    );
    
    res.json({
      success: true,
      message: 'Logo mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour logo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/signature - Mettre à jour le cachet/signature
app.put('/api/users/signature', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { signatureCachetBase64 } = req.body;
  
  if (!signatureCachetBase64) {
    return res.status(400).json({ error: 'Cachet/signature requis' });
  }
  
  try {
    await pool.query(
      'UPDATE users SET signatureCachetBase64 = ?, updatedAt = NOW() WHERE id = ?',
      [signatureCachetBase64, userId]
    );
    
    res.json({
      success: true,
      message: 'Cachet/signature mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour cachet/signature:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/users/logo - Supprimer le logo
app.delete('/api/users/logo', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  try {
    await pool.query(
      'UPDATE users SET logoBase64 = NULL, updatedAt = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Logo supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression logo:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/users/signature - Supprimer le cachet/signature
app.delete('/api/users/signature', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  try {
    await pool.query(
      'UPDATE users SET signatureCachetBase64 = NULL, updatedAt = NOW() WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Cachet/signature supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression cachet/signature:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

---

## 🔄 MODIFICATION DE settings_screen.dart

Remplacer les appels à WebStorageHelper par des appels API:

```dart
// Charger les informations
Future<void> _loadSettings() async {
  if (kIsWeb) {
    final authService = AuthService();
    final headers = await authService.getAuthHeaders();
    
    final response = await http.get(
      Uri.parse('http://localhost:4000/api/users/company-info'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Remplir les contrôleurs avec les données
      _nomSocieteController.text = data['nomSociete'] ?? '';
      _emailController.text = data['email'] ?? '';
      // ... etc
    }
  }
}

// Sauvegarder les informations
Future<void> _saveSettings() async {
  if (kIsWeb) {
    final authService = AuthService();
    final headers = await authService.getAuthHeaders();
    
    final response = await http.put(
      Uri.parse('http://localhost:4000/api/users/company-info'),
      headers: headers,
      body: jsonEncode({
        'nomSociete': _nomSocieteController.text,
        'email': _emailController.text,
        // ... etc
      }),
    );
    
    if (response.statusCode == 200) {
      // Succès
    }
  }
}

// Sauvegarder le logo
Future<void> _saveLogo() async {
  if (kIsWeb && _logoBase64 != null) {
    final authService = AuthService();
    final headers = await authService.getAuthHeaders();
    
    final response = await http.put(
      Uri.parse('http://localhost:4000/api/users/logo'),
      headers: headers,
      body: jsonEncode({
        'logoBase64': _logoBase64,
      }),
    );
  }
}
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [ ] Exécuter le script SQL `add_company_info_to_users.sql`
- [ ] Vérifier que les colonnes ont été ajoutées à la table users
- [ ] Ajouter les routes dans `server.js`
- [ ] Redémarrer le serveur Node.js
- [ ] Tester les routes avec curl ou Postman
- [ ] Modifier `settings_screen.dart` pour utiliser les routes API
- [ ] Tester l'enregistrement des informations depuis l'interface
- [ ] Tester l'upload du logo
- [ ] Tester l'upload du cachet/signature

---

**Date:** 21 décembre 2024  
**Fichiers concernés:**
- `sql/add_company_info_to_users.sql` (script SQL)
- `server.js` (routes API)
- `lib/screens/settings_screen.dart` (interface Flutter)
