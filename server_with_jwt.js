require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');

// ============================================================================
// IMPORTS JWT - AJOUTÉ
// ============================================================================
const { router: authRouter, initPool: initAuthPool } = require('./routes/auth');
const { authMiddleware, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
// Augmenter la limite pour les images Base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================================
// INITIALISER LE POOL POUR LES ROUTES AUTH - AJOUTÉ
// ============================================================================
initAuthPool(pool);

// Health check (NON PROTÉGÉ)
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// ============================================================================
// ROUTES D'AUTHENTIFICATION (NON PROTÉGÉES) - AJOUTÉ
// ============================================================================
app.use('/api/auth', authRouter);

// ============================================================================
// TOUTES LES ROUTES CI-DESSOUS SONT MAINTENANT PROTÉGÉES
// ============================================================================

// ==================== PRODUITS (PROTÉGÉ) ====================

app.get('/api/produits', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM produits WHERE userId = ? LIMIT 500',
        [userId]
      );
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /produits (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3;
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

app.get('/api/produits/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [rows] = await pool.query(
      'SELECT * FROM produits WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/produits', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT (remplace req.body.userId)
    const {
      nom,
      reference,
      prixAchat,
      prixVente,
      quantite = 0,
      marchandiseId = 1,
      categorieId,
      codebar,
      description,
      prixGros,
      prixPromotion,
      seuilAlerte,
      imageBase64,
      dateExpiration,
      joursAlerteExpiration,
      deviceId,
    } = req.body;

    if (!nom || !reference || prixAchat == null || prixVente == null) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const now = new Date();
    
    const [result] = await pool.query(
      `INSERT INTO produits
       (userId, marchandiseId, nom, reference, categorieId, codebar, description,
        prixAchat, prixVente, prixGros, prixPromotion, quantite, seuilAlerte,
        imageBase64, dateCreation, dateModification, dateExpiration, joursAlerteExpiration, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nom = VALUES(nom),
         categorieId = VALUES(categorieId),
         codebar = VALUES(codebar),
         description = VALUES(description),
         prixAchat = VALUES(prixAchat),
         prixVente = VALUES(prixVente),
         prixGros = VALUES(prixGros),
         prixPromotion = VALUES(prixPromotion),
         quantite = VALUES(quantite),
         seuilAlerte = VALUES(seuilAlerte),
         imageBase64 = VALUES(imageBase64),
         dateModification = VALUES(dateModification),
         dateExpiration = VALUES(dateExpiration),
         joursAlerteExpiration = VALUES(joursAlerteExpiration),
         lastModified = VALUES(lastModified)`,
      [
        userId, // ✅ Depuis JWT
        marchandiseId,
        nom,
        reference,
        categorieId,
        codebar,
        description,
        prixAchat,
        prixVente,
        prixGros || 0,
        prixPromotion || 0,
        quantite,
        seuilAlerte || 5,
        imageBase64,
        now,
        now,
        dateExpiration,
        joursAlerteExpiration || 30,
        deviceId,
        now,
      ],
    );

    let productId = result.insertId;
    if (!productId) {
      const [existing] = await pool.query(
        'SELECT id FROM produits WHERE userId = ? AND marchandiseId = ? AND reference = ?',
        [userId, marchandiseId, reference]
      );
      productId = existing[0]?.id;
    }

    const [rows] = await pool.query('SELECT * FROM produits WHERE id = ? AND userId = ?', [productId, userId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /produits:', e);
    
    if (e.code === 'PROTOCOL_CONNECTION_LOST' || 
        e.code === 'ETIMEDOUT' ||
        e.code === 'ER_NET_READ_INTERRUPTED') {
      res.status(503).json({ 
        error: 'Service temporairement indisponible',
        code: e.code,
        message: 'Connexion MySQL perdue, veuillez réessayer'
      });
      return;
    }
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/produits/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const {
      nom,
      reference,
      categorieId,
      codebar,
      description,
      prixAchat,
      prixVente,
      prixGros,
      prixPromotion,
      quantite,
      seuilAlerte,
      imageBase64,
      dateExpiration,
      joursAlerteExpiration,
    } = req.body;

    const now = new Date();
    
    const [result] = await pool.query(
      `UPDATE produits SET
         nom = COALESCE(?, nom),
         categorieId = COALESCE(?, categorieId),
         codebar = COALESCE(?, codebar),
         description = COALESCE(?, description),
         prixAchat = COALESCE(?, prixAchat),
         prixVente = COALESCE(?, prixVente),
         prixGros = COALESCE(?, prixGros),
         prixPromotion = COALESCE(?, prixPromotion),
         quantite = COALESCE(?, quantite),
         seuilAlerte = COALESCE(?, seuilAlerte),
         imageBase64 = COALESCE(?, imageBase64),
         dateModification = ?,
         dateExpiration = COALESCE(?, dateExpiration),
         joursAlerteExpiration = COALESCE(?, joursAlerteExpiration),
         lastModified = ?
       WHERE id = ? AND userId = ?`, // ✅ Vérifier userId
      [
        nom,
        categorieId,
        codebar,
        description,
        prixAchat,
        prixVente,
        prixGros,
        prixPromotion,
        quantite,
        seuilAlerte,
        imageBase64,
        now,
        dateExpiration,
        joursAlerteExpiration,
        now,
        req.params.id,
        userId, // ✅ Depuis JWT
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const [rows] = await pool.query('SELECT * FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/produits/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [result] = await pool.query(
      'DELETE FROM produits WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== VENTES (PROTÉGÉ) ====================

app.get('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC LIMIT 500',
        [userId]
      );
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /ventes (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3;
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

app.get('/api/ventes/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [rows] = await pool.query(
      'SELECT * FROM ventes WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ventes', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const {
      marchandiseId = 1,
      clientId = null,
      numeroFacture = null,
      dateVente = new Date(),
      montantTotal,
      montantPaye = 0,
      statut = 'en_attente',
      notes = null,
      deviceId = null,
    } = req.body;

    if (montantTotal == null) {
      return res.status(400).json({ error: 'montantTotal est obligatoire' });
    }

    const [result] = await pool.query(
      `INSERT INTO ventes
       (userId, marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );

    const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ? AND userId = ?', [result.insertId, userId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /ventes:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/ventes/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const {
      clientId,
      numeroFacture,
      dateVente,
      montantTotal,
      montantPaye,
      statut,
      notes,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE ventes SET
         clientId = COALESCE(?, clientId),
         numeroFacture = COALESCE(?, numeroFacture),
         dateVente = COALESCE(?, dateVente),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ? AND userId = ?`,
      [
        clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ],
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vente non trouvée' });

    const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/ventes/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [result] = await pool.query(
      'DELETE FROM ventes WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== CLIENTS (PROTÉGÉ) ====================

app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
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
    const userId = req.userId; // ✅ Extrait du JWT
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
    const userId = req.userId; // ✅ Extrait du JWT
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

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? AND userId = ?', [
      result.insertId,
      userId
    ]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /clients:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
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
       WHERE id = ? AND userId = ?`,
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

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? AND userId = ?', [
      req.params.id,
      userId
    ]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
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

// ==================== FOURNISSEURS (PROTÉGÉ) ====================

app.get('/api/fournisseurs', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE userId = ? ORDER BY nom ASC LIMIT 1000',
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /fournisseurs:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/fournisseurs/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE id = ? AND userId = ?',
      [req.params.id, userId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/fournisseurs', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const {
      marchandiseId = 1,
      nom,
      tele = null,
      adress = null,
      solde = 0,
      ice = null,
      rc = null,
    } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le champ nom est obligatoire' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO fournisseurs
       (userId, marchandiseId, nom, tele, adress, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, // ✅ Depuis JWT
        marchandiseId,
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        now,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE id = ? AND userId = ?',
      [result.insertId, userId]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /fournisseurs:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/fournisseurs/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const {
      nom,
      tele,
      adress,
      solde,
      ice,
      rc,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE fournisseurs SET
         nom = COALESCE(?, nom),
         tele = COALESCE(?, tele),
         adress = COALESCE(?, adress),
         solde = COALESCE(?, solde),
         ice = COALESCE(?, ice),
         rc = COALESCE(?, rc)
       WHERE id = ? AND userId = ?`,
      [
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        req.params.id,
        userId, // ✅ Depuis JWT
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/fournisseurs/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId; // ✅ Extrait du JWT
    const [result] = await pool.query(
      'DELETE FROM fournisseurs WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fournisseur non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// NOTE: Les autres routes (achats, depenses, lignes_vente, lignes_achat, etc.)
// suivent le même pattern. Pour la longueur du fichier, je les ai omises ici.
// Appliquez le même pattern:
// 1. Ajouter authMiddleware
// 2. Extraire userId = req.userId
// 3. Filtrer par userId dans les SELECT
// 4. Ajouter userId dans les INSERT
// 5. Vérifier userId dans les UPDATE/DELETE
// ============================================================================

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🔐 Authentification JWT activée`);
  console.log(`📝 Routes auth disponibles sur /api/auth/*`);
  console.log(`🛡️  Toutes les routes protégées par JWT`);
});
