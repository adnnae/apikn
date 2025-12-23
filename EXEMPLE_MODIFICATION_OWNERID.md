# 📝 Exemple de Modification pour utiliser ownerId

## ❌ AVANT (filtre par userId)

```javascript
// GET /api/ventes - Récupérer les ventes
app.get('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  try {
    const [ventes] = await pool.query(
      'SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC',
      [userId]  // ❌ Filtre par userId
    );
    
    res.json(ventes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## ✅ APRÈS (filtre par ownerId)

```javascript
// GET /api/ventes - Récupérer les ventes
app.get('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId;
  const ownerId = req.ownerId; // ✅ Ajouté automatiquement par le middleware
  
  try {
    const [ventes] = await pool.query(
      'SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC',
      [ownerId]  // ✅ Filtre par ownerId pour partager les données
    );
    
    res.json(ventes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 Routes à Modifier

### SELECT (utiliser ownerId)
- ✅ GET /api/ventes
- ✅ GET /api/achats
- ✅ GET /api/clients
- ✅ GET /api/fournisseurs
- ✅ GET /api/produits
- ✅ GET /api/stock
- ✅ GET /api/reglements
- ✅ GET /api/depenses
- ✅ GET /api/devis
- ✅ GET /api/factures
- ✅ GET /api/retours

### INSERT (garder userId)
- ⚠️ POST /api/ventes → Garder `userId` (pour savoir qui a créé)
- ⚠️ POST /api/achats → Garder `userId`
- ⚠️ POST /api/clients → Garder `userId`

### UPDATE/DELETE (utiliser ownerId)
- ✅ PUT /api/ventes/:id → Utiliser `ownerId` dans WHERE
- ✅ DELETE /api/ventes/:id → Utiliser `ownerId` dans WHERE

## 🔍 Exemple Complet: Route Ventes

```javascript
// GET /api/ventes
app.get('/api/ventes', authMiddleware, async (req, res) => {
  const ownerId = req.ownerId; // ✅ Partage des données
  
  const [ventes] = await pool.query(
    'SELECT * FROM ventes WHERE userId = ?',
    [ownerId]
  );
  res.json(ventes);
});

// POST /api/ventes
app.post('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Garder userId pour savoir qui a créé
  const { clientId, montant, ... } = req.body;
  
  const [result] = await pool.query(
    'INSERT INTO ventes (clientId, montant, userId, ...) VALUES (?, ?, ?, ...)',
    [clientId, montant, userId, ...] // ✅ userId = créateur
  );
  res.json({ id: result.insertId });
});

// PUT /api/ventes/:id
app.put('/api/ventes/:id', authMiddleware, async (req, res) => {
  const ownerId = req.ownerId; // ✅ Partage des données
  const { id } = req.params;
  const { montant, ... } = req.body;
  
  await pool.query(
    'UPDATE ventes SET montant = ?, ... WHERE id = ? AND userId = ?',
    [montant, ..., id, ownerId] // ✅ ownerId pour vérifier les droits
  );
  res.json({ success: true });
});

// DELETE /api/ventes/:id
app.delete('/api/ventes/:id', authMiddleware, async (req, res) => {
  const ownerId = req.ownerId; // ✅ Partage des données
  const { id } = req.params;
  
  await pool.query(
    'DELETE FROM ventes WHERE id = ? AND userId = ?',
    [id, ownerId] // ✅ ownerId pour vérifier les droits
  );
  res.json({ success: true });
});
```

## 🚀 Script Automatique

Pour appliquer automatiquement le middleware:

```bash
node apply_ownerId_filters_safe.js
```

Puis modifiez manuellement les routes selon les exemples ci-dessus.
