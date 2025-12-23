# 🔐 Intégration JWT dans server.js

## Étapes d'intégration

### 1. Ajouter les imports en haut de server.js

```javascript
// Après les imports existants, ajouter:
const { router: authRouter, initPool: initAuthPool } = require('./routes/auth');
const { authMiddleware, requireRole } = require('./middleware/auth');
```

### 2. Initialiser le pool pour les routes auth

```javascript
// Après la création de l'app, avant les routes, ajouter:
initAuthPool(pool);
```

### 3. Ajouter les routes d'authentification (NON PROTÉGÉES)

```javascript
// Après app.get('/api/health', ...), ajouter:

// ============================================================================
// ROUTES D'AUTHENTIFICATION (NON PROTÉGÉES)
// ============================================================================
app.use('/api/auth', authRouter);
```

### 4. Protéger TOUTES les routes existantes

Pour chaque route existante, ajouter `authMiddleware` et filtrer par `userId`:

#### Exemple: Routes Produits

**AVANT:**
```javascript
app.get('/api/produits', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM produits LIMIT 500');
  res.json(rows);
});
```

**APRÈS:**
```javascript
app.get('/api/produits', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const [rows] = await pool.query(
    'SELECT * FROM produits WHERE userId = ? LIMIT 500',
    [userId]
  );
  res.json(rows);
});
```

#### Exemple: POST Produits

**AVANT:**
```javascript
app.post('/api/produits', async (req, res) => {
  const { nom, reference, prixAchat, prixVente, ... } = req.body;
  // ...
});
```

**APRÈS:**
```javascript
app.post('/api/produits', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const { nom, reference, prixAchat, prixVente, ... } = req.body;
  
  // Utiliser userId au lieu de req.body.userId
  const [result] = await pool.query(
    `INSERT INTO produits (userId, nom, reference, ...) VALUES (?, ?, ?, ...)`,
    [userId, nom, reference, ...]
  );
  // ...
});
```

### 5. Pattern à appliquer PARTOUT

```javascript
// GET - Filtrer par userId
app.get('/api/TABLE', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const [rows] = await pool.query('SELECT * FROM TABLE WHERE userId = ?', [userId]);
  res.json(rows);
});

// GET by ID - Vérifier que c'est bien son enregistrement
app.get('/api/TABLE/:id', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const [rows] = await pool.query(
    'SELECT * FROM TABLE WHERE id = ? AND userId = ?',
    [req.params.id, userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Non trouvé' });
  res.json(rows[0]);
});

// POST - Ajouter userId automatiquement
app.post('/api/TABLE', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { field1, field2, ... } = req.body;
  
  const [result] = await pool.query(
    'INSERT INTO TABLE (userId, field1, field2, ...) VALUES (?, ?, ?, ...)',
    [userId, field1, field2, ...]
  );
  // ...
});

// PUT - Vérifier que c'est bien son enregistrement
app.put('/api/TABLE/:id', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const { field1, field2, ... } = req.body;
  
  const [result] = await pool.query(
    'UPDATE TABLE SET field1 = ?, field2 = ?, ... WHERE id = ? AND userId = ?',
    [field1, field2, ..., req.params.id, userId]
  );
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Non trouvé' });
  }
  // ...
});

// DELETE - Vérifier que c'est bien son enregistrement
app.delete('/api/TABLE/:id', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  const [result] = await pool.query(
    'DELETE FROM TABLE WHERE id = ? AND userId = ?',
    [req.params.id, userId]
  );
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Non trouvé' });
  }
  res.json({ success: true });
});
```

## Tables à protéger

Appliquer le pattern ci-dessus pour TOUTES ces routes:

- ✅ `/api/produits`
- ✅ `/api/ventes`
- ✅ `/api/achats`
- ✅ `/api/clients`
- ✅ `/api/fournisseurs`
- ✅ `/api/depenses`
- ✅ `/api/categories`
- ✅ `/api/lignes_vente`
- ✅ `/api/lignes_achat`
- ✅ `/api/lignes_retour_vente`
- ✅ `/api/lignes_retour_achat`
- ✅ `/api/retours_ventes`
- ✅ `/api/retours_achats`
- ✅ `/api/reglements_clients`
- ✅ `/api/reglements_fournisseurs`
- ✅ `/api/historique_reglements_clients`
- ✅ `/api/historique_reglements_fournisseurs`
- ✅ `/api/sync_metadata`

## Routes à NE PAS protéger

- ❌ `/api/health` - Health check public
- ❌ `/api/auth/*` - Routes d'authentification (déjà gérées)

## Exemple complet pour une table

```javascript
// ==================== CLIENTS (PROTÉGÉ) ====================

app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE userId = ? ORDER BY nom ASC LIMIT 1000',
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /clients:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Depuis JWT
    const {
      marchandiseId = 1,
      nom,
      prenom = null,
      entreprise = null,
      email = null,
      telephone = null,
      adresse = null,
      solde = 0,
      ice = null,
      rc = null,
    } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le champ nom est obligatoire' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO clients
       (userId, marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, // ✅ Depuis JWT
        marchandiseId,
        nom,
        prenom,
        entreprise,
        email,
        telephone,
        adresse,
        solde,
        ice,
        rc,
        now,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /clients:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Depuis JWT
    const {
      nom,
      prenom,
      entreprise,
      email,
      telephone,
      adresse,
      solde,
      ice,
      rc,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE clients SET
         nom = COALESCE(?, nom),
         prenom = COALESCE(?, prenom),
         entreprise = COALESCE(?, entreprise),
         email = COALESCE(?, email),
         telephone = COALESCE(?, telephone),
         adresse = COALESCE(?, adresse),
         solde = COALESCE(?, solde),
         ice = COALESCE(?, ice),
         rc = COALESCE(?, rc)
       WHERE id = ? AND userId = ?`, // ✅ Vérifier userId
      [
        nom,
        prenom,
        entreprise,
        email,
        telephone,
        adresse,
        solde,
        ice,
        rc,
        req.params.id,
        userId, // ✅ Depuis JWT
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM clients WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Depuis JWT
    const [result] = await pool.query(
      'DELETE FROM clients WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});
```

## Checklist

- [ ] Imports ajoutés en haut de server.js
- [ ] initAuthPool(pool) appelé
- [ ] Routes /api/auth ajoutées (NON protégées)
- [ ] Toutes les routes existantes protégées avec authMiddleware
- [ ] Tous les SELECT filtrent par userId
- [ ] Tous les INSERT incluent userId
- [ ] Tous les UPDATE/DELETE vérifient userId
- [ ] Tests effectués

## Test rapide

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copier le token reçu

# 2. Tester une route protégée
curl -X GET http://localhost:4000/api/clients \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"

# 3. Tester sans token (devrait échouer)
curl -X GET http://localhost:4000/api/clients
```

## Prochaine étape

Une fois server.js mis à jour, passer à l'application Flutter pour gérer l'authentification côté client.
