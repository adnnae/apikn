require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // ✅ Ajout pour hasher les mots de passe
const { pool, testConnection } = require('./db');
// ============================================================================
// IMPORTS JWT - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
const { router: authRouter, initPool: initAuthPool } = require('./routes/auth');
const { authMiddleware, requireRole } = require('./middleware/auth');
const { addOwnerIdMiddleware } = require('./middleware/ownerId');


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
// Augmenter la limite pour les images Base64 (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// ============================================================================
// INITIALISER LE POOL POUR LES ROUTES AUTH - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
initAuthPool(pool);

// ============================================================================
// ROUTES D'AUTHENTIFICATION (NON PROTÉGÉES) - AJOUTÉ PAR apply_jwt_to_server.js
// ============================================================================
app.use('/api/auth', authRouter);

// ============================================================================
// MIDDLEWARE OWNERID - Ajoute automatiquement req.ownerId pour le partage de données
// ============================================================================
app.use(addOwnerIdMiddleware(pool));

// ============================================================================
// TOUTES LES ROUTES CI-DESSOUS SONT MAINTENANT PROTÉGÉES PAR JWT
// ============================================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Example: produits CRUD
app.get('/api/produits', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // ✅ AVEC IMAGES ET FILTRAGE PAR USERID
      // Note: Si la colonne userId n'existe pas, la requête échouera
      // Dans ce cas, exécutez d'abord: ALTER TABLE produits ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id
      const [rows] = await pool.query(
        `SELECT * FROM produits 
         WHERE userId = ? 
         ORDER BY id DESC 
         LIMIT 500`,
        [userId]
      );
      console.log(`✅ [API] ${rows.length} produits récupérés pour userId=${userId} (avec images)`);
      res.json(rows);
      return; // Succès, sortir de la boucle
    } catch (e) {
      retries++;
      console.error(`❌ Erreur GET /produits (tentative ${retries}/${maxRetries}):`, e.message);
      console.error(`   Code erreur: ${e.code}`);
      console.error(`   SQL State: ${e.sqlState}`);
      
      // Si erreur "Unknown column 'userId'", donner un message clair
      if (e.code === 'ER_BAD_FIELD_ERROR' && e.message.includes('userId')) {
        console.error('');
        console.error('⚠️  ERREUR: La colonne "userId" n\'existe pas dans la table "produits"');
        console.error('📋 SOLUTION: Exécutez cette commande SQL dans MySQL:');
        console.error('   ALTER TABLE produits ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id;');
        console.error('   ALTER TABLE produits ADD INDEX idx_userId (userId);');
        console.error('');
        res.status(500).json({ 
          error: 'Configuration base de données incomplète',
          message: 'La colonne userId n\'existe pas dans la table produits',
          solution: 'ALTER TABLE produits ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id;'
        });
        return;
      }
      
      // Si erreur de connexion, attendre et réessayer
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3; // Délai progressif: 3s, 6s, 9s
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes... (${retries}/${maxRetries})`);
        console.log(`   Serveur MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue; // Réessayer
      }
      
      // Si dernière tentative ou autre erreur
      res.status(500).json({ error: e.message, code: e.code });
      return;
    }
  }
});

app.get('/api/produits/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/produits', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
    
    // ✅ UTILISER INSERT ... ON DUPLICATE KEY UPDATE pour éviter les erreurs duplicate
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
        userId,
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

    // Si INSERT, result.insertId existe
    // Si UPDATE, récupérer l'ID existant
    let productId = result.insertId;
    if (!productId) {
      const [existing] = await pool.query(
        'SELECT id FROM produits WHERE userId = ? AND marchandiseId = ? AND reference = ?',
        [userId, marchandiseId, reference]
      );
      productId = existing[0]?.id;
    }

    const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [productId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /produits:', e);
    
    // Gérer spécifiquement les erreurs de connexion
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
    
    // Gérer duplicate entry (ne devrait plus arriver avec ON DUPLICATE KEY UPDATE)
    if (e.code === 'ER_DUP_ENTRY') {
      // Si ça arrive quand même, essayer de récupérer l'ID existant
      try {
        const { userId, marchandiseId, reference } = req.body;
        const [existing] = await pool.query(
          'SELECT id FROM produits WHERE userId = ? AND marchandiseId = ? AND reference = ?',
          [userId, marchandiseId, reference]
        );
        if (existing[0]) {
          const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [existing[0].id]);
          res.status(200).json(rows[0]);
          return;
        }
      } catch (err) {
        // Ignorer
      }
      res.status(409).json({ 
        error: 'Entrée dupliquée',
        code: e.code,
        message: e.sqlMessage
      });
      return;
    }
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/produits/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId,
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
      deviceId,
    } = req.body;

    const now = new Date();
    
    console.log(`📝 PUT /api/produits/${req.params.id} - Modification du produit`);
    
    // PUT = UPDATE uniquement, PAS de création
    // NE PAS modifier userId, marchandiseId, reference (contrainte UNIQUE)
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
       WHERE id = ?`,
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
      ]
    );

    // Si le produit n'existe pas, ignorer silencieusement (sera créé par POST plus tard)
    if (result.affectedRows === 0) {
      console.log(`⚠️ Produit #${req.params.id} introuvable - UPDATE ignoré (sera créé par POST)`);
      // Retourner un objet vide pour ne pas bloquer la sync
      return res.status(200).json({ id: req.params.id, message: 'En attente de création' });
    }
    
    console.log(`✅ Produit #${req.params.id} mis à jour avec succès`)

    const [rows] = await pool.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/produits/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query('DELETE FROM produits WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /produits/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== VENTES ====================

app.get('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query('SELECT * FROM ventes WHERE userId = ? ORDER BY dateVente DESC LIMIT 500', [userId]);
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /ventes (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3; // Délai progressif: 3s, 6s, 9s
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

app.get('/api/ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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

    const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /ventes:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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

    const [rows] = await pool.query('SELECT * FROM ventes WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query('DELETE FROM ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vente non trouvée' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== LIGNES VENTE ====================

app.get('/api/lignes_vente', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM lignes_vente WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /lignes_vente:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/lignes_vente', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      venteId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
    } = req.body;

    if (!venteId || !produitId || quantite == null || prixUnitaire == null) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const [result] = await pool.query(
      `INSERT INTO lignes_vente (venteId, produitId, quantite, prixUnitaire, montantLigne, userId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantite = VALUES(quantite),
         prixUnitaire = VALUES(prixUnitaire),
         montantLigne = VALUES(montantLigne)`,
      [venteId, produitId, quantite, prixUnitaire, montantLigne || (quantite * prixUnitaire), userId],
    );

    const productId = result.insertId || (await pool.query(
      'SELECT id FROM lignes_vente WHERE venteId = ? AND produitId = ?',
      [venteId, produitId]
    ))[0][0]?.id;

    const [rows] = await pool.query('SELECT * FROM lignes_vente WHERE id = ?', [productId || result.insertId]);
    res.status(201).json(rows[0] || rows);
  } catch (e) {
    console.error('Erreur POST /lignes_vente:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== LIGNES ACHAT ====================

app.get('/api/lignes_achat', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM lignes_achat WHERE userId = ? ORDER BY id DESC LIMIT 1000', [userId]);
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /lignes_achat:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/lignes_achat', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      achatId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
    } = req.body;

    if (!achatId || !produitId || quantite == null || prixUnitaire == null) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const [result] = await pool.query(
      `INSERT INTO lignes_achat (achatId, produitId, quantite, prixUnitaire, montantLigne, userId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantite = VALUES(quantite),
         prixUnitaire = VALUES(prixUnitaire),
         montantLigne = VALUES(montantLigne)`,
      [achatId, produitId, quantite, prixUnitaire, montantLigne || (quantite * prixUnitaire), userId],
    );

    const productId = result.insertId || (await pool.query(
      'SELECT id FROM lignes_achat WHERE achatId = ? AND produitId = ?',
      [achatId, produitId]
    ))[0][0]?.id;

    const [rows] = await pool.query('SELECT * FROM lignes_achat WHERE id = ?', [productId || result.insertId]);
    res.status(201).json(rows[0] || rows);
  } catch (e) {
    console.error('Erreur POST /lignes_achat:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== ACHATS ====================

app.get('/api/achats', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query('SELECT * FROM achats WHERE userId = ? ORDER BY dateAchat DESC LIMIT 500', [userId]);
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /achats (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3; // Délai progressif: 3s, 6s, 9s
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

app.get('/api/achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Achat non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/achats', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId = 1,
      fournisseurId = null,
      dateAchat = new Date(),
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
      `INSERT INTO achats
       (userId, marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );

    const [rows] = await pool.query('SELECT * FROM achats WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /achats:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      fournisseurId,
      dateAchat,
      montantTotal,
      montantPaye,
      statut,
      notes,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE achats SET
         fournisseurId = COALESCE(?, fournisseurId),
         dateAchat = COALESCE(?, dateAchat),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ? AND userId = ?`,
      [
        fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ],
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Achat non trouvé' });

    const [rows] = await pool.query('SELECT * FROM achats WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query('DELETE FROM achats WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Achat non trouvé' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== DEPENSES ====================

app.get('/api/depenses', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query('SELECT * FROM depenses WHERE userId = ? ORDER BY dateDepense DESC LIMIT 500', [userId]);
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /depenses (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3; // Délai progressif: 3s, 6s, 9s
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes... (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

app.get('/api/depenses/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dépense non trouvée' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /depenses/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/depenses', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId = 1,
      libelle,
      montant,
      dateDepense = new Date(),
      description = null,
      categorie = null,
      modePaiement = null,
      deviceId = null,
    } = req.body;

    if (!libelle || montant == null) {
      return res.status(400).json({ error: 'libelle et montant sont obligatoires' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO depenses
       (userId, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, now, now, deviceId, now,
      ],
    );

    const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /depenses:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/depenses/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId = 1,
      libelle,
      montant,
      dateDepense,
      description,
      categorie,
      modePaiement,
      deviceId,
    } = req.body;

    const now = new Date();
    
    // Utiliser INSERT ... ON DUPLICATE KEY UPDATE pour un véritable UPSERT
    // Cela met à jour si l'ID existe, ou insère si nouveau
    await pool.query(
      `INSERT INTO depenses
       (id, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         marchandiseId = COALESCE(VALUES(marchandiseId), marchandiseId),
         libelle = COALESCE(VALUES(libelle), libelle),
         montant = COALESCE(VALUES(montant), montant),
         dateDepense = COALESCE(VALUES(dateDepense), dateDepense),
         description = COALESCE(VALUES(description), description),
         categorie = COALESCE(VALUES(categorie), categorie),
         modePaiement = COALESCE(VALUES(modePaiement), modePaiement),
         dateModification = VALUES(dateModification),
         lastModified = VALUES(lastModified)`,
      [
        req.params.id,
        marchandiseId,
        libelle,
        montant,
        dateDepense,
        description,
        categorie,
        modePaiement,
        now,
        now,
        deviceId,
        now,
      ],
    );

    const [rows] = await pool.query('SELECT * FROM depenses WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /depenses/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/depenses/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query('DELETE FROM depenses WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Dépense non trouvée' });
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /depenses/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== CLIENTS ====================

app.get('/api/clients', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ? AND userId = ?', [
      req.params.id,
      userId,
    ]);
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
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
      return res
        .status(400)
        .json({ error: 'Le champ nom est obligatoire' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO clients
       (userId, marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /clients:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId = 1,
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

    const now = new Date();
    
    // Utiliser INSERT ... ON DUPLICATE KEY UPDATE pour un véritable UPSERT
    // Cela met à jour si l'ID existe, ou insère si nouveau
    await pool.query(
      `INSERT INTO clients
       (id, marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         marchandiseId = COALESCE(VALUES(marchandiseId), marchandiseId),
         nom = COALESCE(VALUES(nom), nom),
         prenom = COALESCE(VALUES(prenom), prenom),
         entreprise = COALESCE(VALUES(entreprise), entreprise),
         email = COALESCE(VALUES(email), email),
         telephone = COALESCE(VALUES(telephone), telephone),
         adresse = COALESCE(VALUES(adresse), adresse),
         solde = COALESCE(VALUES(solde), solde),
         ice = COALESCE(VALUES(ice), ice),
         rc = COALESCE(VALUES(rc), rc)`,
      [
        req.params.id,
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

    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query('DELETE FROM clients WHERE id = ? AND userId = ?', [
      req.params.id,
      userId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /clients/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== FOURNISSEURS ====================

app.get('/api/fournisseurs', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
  const userId = req.userId; // ✅ Extrait du JWT
  try {
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
      return res
        .status(400)
        .json({ error: 'Le champ nom est obligatoire' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO fournisseurs
       (userId, marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        marchandiseId,
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        now,
        now,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE id = ?',
      [result.insertId],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /fournisseurs:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/fournisseurs/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId = 1,
      nom,
      tele,
      adress,
      solde,
      ice,
      rc,
    } = req.body;

    const now = new Date();
    
    // Utiliser INSERT ... ON DUPLICATE KEY UPDATE pour un véritable UPSERT
    // Cela met à jour si l'ID existe, ou insère si nouveau
    await pool.query(
      `INSERT INTO fournisseurs
       (id, marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         marchandiseId = COALESCE(VALUES(marchandiseId), marchandiseId),
         nom = COALESCE(VALUES(nom), nom),
         tele = COALESCE(VALUES(tele), tele),
         adress = COALESCE(VALUES(adress), adress),
         solde = COALESCE(VALUES(solde), solde),
         ice = COALESCE(VALUES(ice), ice),
         rc = COALESCE(VALUES(rc), rc),
         dateModification = VALUES(dateModification)`,
      [
        req.params.id,
        marchandiseId,
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        now,
        now,
      ],
    );

    const [rows] = await pool.query(
      'SELECT * FROM fournisseurs WHERE id = ?',
      [req.params.id],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/fournisseurs/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query(
      'DELETE FROM fournisseurs WHERE id = ? AND userId = ?',
      [req.params.id, userId],
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

// ==================== CATEGORIES ====================

app.get('/api/categories', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE userId = ? ORDER BY nom ASC LIMIT 1000',
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /categories:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/categories/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /categories/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const { marchandiseId = 1, nom, description = null } = req.body;
    const [result] = await pool.query(
      'INSERT INTO categories (marchandiseId, userId, nom, description, dateCreation, dateModification) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [marchandiseId, userId, nom, description]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /categories:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const { nom, description } = req.body;
    const [result] = await pool.query(
      'UPDATE categories SET nom = ?, description = ?, dateModification = NOW() WHERE id = ? AND userId = ?',
      [nom, description, req.params.id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /categories/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND userId = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /categories/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== RETOURS VENTES ====================

app.get('/api/retours_ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /retours_ventes (tentative ${retries}/${maxRetries}):`, e);
      
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

app.get('/api/retours_ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Retour de vente non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /retours_ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/retours_ventes', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      id,
      marchandiseId,
      venteId,
      clientId = null,
      dateRetour = new Date(),
      montantTotal,
      statut = 'valide',
      raison = null,
      notes = null,
      deviceId = null,
    } = req.body;

    if (!marchandiseId || !venteId || montantTotal == null) {
      return res.status(400).json({ error: 'marchandiseId, venteId et montantTotal sont obligatoires' });
    }

    const now = new Date();
    
    // Si un ID est fourni (pour cohérence avec SQLite)
    if (id) {
      await pool.query(
        `INSERT INTO retours_ventes
         (id, userId, marchandiseId, venteId, clientId, dateRetour, montantTotal,
          statut, raison, notes, deviceId, lastModified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           montantTotal = VALUES(montantTotal),
           statut = VALUES(statut),
           raison = VALUES(raison),
           notes = VALUES(notes),
           lastModified = VALUES(lastModified)`,
        [id, userId, marchandiseId, venteId, clientId, dateRetour, montantTotal,
         statut, raison, notes, deviceId, now],
      );
      
      const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [id]);
      return res.status(201).json(rows[0]);
    }

    // Sinon, insertion normale
    const [result] = await pool.query(
      `INSERT INTO retours_ventes
       (userId, marchandiseId, venteId, clientId, dateRetour, montantTotal,
        statut, raison, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, venteId, clientId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now],
    );

    const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /retours_ventes:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Un retour avec cet ID existe déjà' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/retours_ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId,
      venteId,
      clientId,
      dateRetour,
      montantTotal,
      statut,
      raison,
      notes,
      deviceId,
    } = req.body;

    const now = new Date();
    
    const [result] = await pool.query(
      `UPDATE retours_ventes SET
         marchandiseId = COALESCE(?, marchandiseId),
         venteId = COALESCE(?, venteId),
         clientId = COALESCE(?, clientId),
         dateRetour = COALESCE(?, dateRetour),
         montantTotal = COALESCE(?, montantTotal),
         statut = COALESCE(?, statut),
         raison = COALESCE(?, raison),
         notes = COALESCE(?, notes),
         deviceId = COALESCE(?, deviceId),
         lastModified = ?
       WHERE id = ?`,
      [marchandiseId, venteId, clientId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour de vente non trouvé' });
    }

    const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /retours_ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/retours_ventes/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    // Supprimer les lignes de retour associées d'abord
    await pool.query('DELETE FROM lignes_retour_vente WHERE retourVenteId = ?', [req.params.id]);
    
    const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour de vente non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /retours_ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== RETOURS ACHATS ====================

app.get('/api/retours_achats', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query('SELECT * FROM retours_achats WHERE userId = ? ORDER BY dateRetour DESC LIMIT 500', [userId]);
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /retours_achats (tentative ${retries}/${maxRetries}):`, e);
      
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

app.get('/api/retours_achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Retour d\'achat non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /retours_achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/retours_achats', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      id,
      marchandiseId,
      achatId,
      fournisseurId = null,
      dateRetour = new Date(),
      montantTotal,
      statut = 'valide',
      raison = null,
      notes = null,
      deviceId = null,
    } = req.body;

    if (!marchandiseId || !achatId || montantTotal == null) {
      return res.status(400).json({ error: 'marchandiseId, achatId et montantTotal sont obligatoires' });
    }

    const now = new Date();
    
    // Si un ID est fourni (pour cohérence avec SQLite)
    if (id) {
      await pool.query(
        `INSERT INTO retours_achats
         (id, userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
          statut, raison, notes, deviceId, lastModified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           montantTotal = VALUES(montantTotal),
           statut = VALUES(statut),
           raison = VALUES(raison),
           notes = VALUES(notes),
           lastModified = VALUES(lastModified)`,
        [id, userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
         statut, raison, notes, deviceId, now],
      );
      
      const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [id]);
      return res.status(201).json(rows[0]);
    }

    // Sinon, insertion normale
    const [result] = await pool.query(
      `INSERT INTO retours_achats
       (userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
        statut, raison, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now],
    );

    const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /retours_achats:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Un retour avec cet ID existe déjà' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/retours_achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId,
      achatId,
      fournisseurId,
      dateRetour,
      montantTotal,
      statut,
      raison,
      notes,
      deviceId,
    } = req.body;

    const now = new Date();
    
    const [result] = await pool.query(
      `UPDATE retours_achats SET
         marchandiseId = COALESCE(?, marchandiseId),
         achatId = COALESCE(?, achatId),
         fournisseurId = COALESCE(?, fournisseurId),
         dateRetour = COALESCE(?, dateRetour),
         montantTotal = COALESCE(?, montantTotal),
         statut = COALESCE(?, statut),
         raison = COALESCE(?, raison),
         notes = COALESCE(?, notes),
         deviceId = COALESCE(?, deviceId),
         lastModified = ?
       WHERE id = ?`,
      [marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour d\'achat non trouvé' });
    }

    const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /retours_achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/retours_achats/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    // Supprimer les lignes de retour associées d'abord
    await pool.query('DELETE FROM lignes_retour_achat WHERE retourAchatId = ?', [req.params.id]);
    
    const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ? AND userId = ?', [req.params.id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour d\'achat non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /retours_achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// ==================== LIGNES RETOUR VENTE ====================
const lignesRetourVenteRouter = require('./routes/lignes_retour_vente');
app.use('/api/lignes_retour_vente', lignesRetourVenteRouter);

// ==================== LIGNES RETOUR ACHAT ====================
const lignesRetourAchatRouter = require('./routes/lignes_retour_achat');
app.use('/api/lignes_retour_achat', lignesRetourAchatRouter);

// ==================== REGLEMENTS CLIENTS ====================
const reglementsClientsRouter = require('./routes/reglements_clients');
app.use('/api/reglements_clients', reglementsClientsRouter);

// ==================== REGLEMENTS FOURNISSEURS ====================
const reglementsFournisseursRouter = require('./routes/reglements_fournisseurs');
app.use('/api/reglements_fournisseurs', reglementsFournisseursRouter);

// ✅ Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur API:', err);
  
  // Erreurs MySQL
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
      err.code === 'ETIMEDOUT' ||
      err.code === 'ER_NET_READ_INTERRUPTED') {
    res.status(503).json({ 
      error: 'Service temporairement indisponible',
      code: err.code,
      message: 'Connexion MySQL perdue, veuillez réessayer'
    });
    return;
  }
  
  // Erreurs duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ 
      error: 'Entrée dupliquée',
      code: err.code,
      message: err.sqlMessage
    });
    return;
  }
  
  // Autres erreurs
  res.status(500).json({ 
    error: err.message || 'Erreur serveur',
    code: err.code
  });
});

// ==================== PARAMÈTRES DE SOCIÉTÉ ====================

// GET /api/users/company-info - Récupérer les informations de société de l'utilisateur connecté
app.get('/api/users/company-info', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  
  try {
    // Essayer de récupérer les infos de l'owner
    let [rows] = await pool.query(
      `SELECT 
        id, username, email, role,
        nomSociete, raisonSociale, telephone, telephone2, fixe, fax,
        ville, adresseComplete, ice, rc, if_, cnss,
        banque, codeBanque, compteBanque, activite, texte,
        logoBase64, signatureCachetBase64,
        devise, langue, configurationTerminee
      FROM users 
      WHERE id = ?`,
      [ownerId]
    );
    
    // Si l'owner n'existe pas, utiliser l'utilisateur connecté
    if (rows.length === 0 && ownerId !== currentUserId) {
      console.log(`⚠️ [API] Owner ${ownerId} introuvable, utilisation de l'utilisateur connecté ${currentUserId}`);
      [rows] = await pool.query(
        `SELECT 
          id, username, email, role,
          nomSociete, raisonSociale, telephone, telephone2, fixe, fax,
          ville, adresseComplete, ice, rc, if_, cnss,
          banque, codeBanque, compteBanque, activite, texte,
          logoBase64, signatureCachetBase64,
          devise, langue, configurationTerminee
        FROM users 
        WHERE id = ?`,
        [currentUserId]
      );
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ [API] Informations société récupérées pour userId=${rows[0].id}`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Erreur récupération informations société:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/users/company-info - Mettre à jour les informations de société
app.put('/api/users/company-info', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  const {
    nomSociete, raisonSociale, telephone, telephone2, fixe, fax,
    ville, adresseComplete, ice, rc, if_, cnss,
    banque, codeBanque, compteBanque, activite, texte,
    devise, langue, configurationTerminee
  } = req.body;
  
  try {
    // Vérifier si l'owner existe
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    
    // Utiliser l'utilisateur connecté si l'owner n'existe pas
    const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
    
    if (ownerCheck.length === 0 && ownerId !== currentUserId) {
      console.log(`⚠️ [API] Owner ${ownerId} introuvable, mise à jour pour l'utilisateur connecté ${currentUserId}`);
    }
    
    // Mettre à jour l'utilisateur
    await pool.query(
      `UPDATE users SET
        nomSociete = ?, raisonSociale = ?, telephone = ?, 
        telephone2 = ?, fixe = ?, fax = ?,
        ville = ?, adresseComplete = ?, ice = ?, rc = ?, if_ = ?, cnss = ?,
        banque = ?, codeBanque = ?, compteBanque = ?, activite = ?, texte = ?,
        devise = ?, langue = ?, configurationTerminee = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [
        nomSociete, raisonSociale, telephone,
        telephone2, fixe, fax,
        ville, adresseComplete, ice, rc, if_, cnss,
        banque, codeBanque, compteBanque, activite, texte,
        devise, langue, configurationTerminee,
        targetUserId
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
      [targetUserId]
    );
    
    console.log(`✅ [API] Informations société mises à jour pour userId=${targetUserId}`);
    res.json({
      success: true,
      message: 'Informations de société mises à jour avec succès',
      user: rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour informations société:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/users/logo - Mettre à jour le logo
app.put('/api/users/logo', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  const { logoBase64 } = req.body;
  
  if (!logoBase64) {
    return res.status(400).json({ error: 'Logo requis' });
  }
  
  try {
    // Vérifier si l'owner existe
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
    
    await pool.query(
      'UPDATE users SET logoBase64 = ?, updatedAt = NOW() WHERE id = ?',
      [logoBase64, targetUserId]
    );
    
    console.log(`✅ [API] Logo mis à jour pour userId=${targetUserId}`);
    res.json({
      success: true,
      message: 'Logo mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour logo:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/users/signature - Mettre à jour le cachet/signature
app.put('/api/users/signature', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  const { signatureCachetBase64 } = req.body;
  
  if (!signatureCachetBase64) {
    return res.status(400).json({ error: 'Cachet/signature requis' });
  }
  
  try {
    // Vérifier si l'owner existe
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
    
    await pool.query(
      'UPDATE users SET signatureCachetBase64 = ?, updatedAt = NOW() WHERE id = ?',
      [signatureCachetBase64, targetUserId]
    );
    
    console.log(`✅ [API] Cachet/signature mis à jour pour userId=${targetUserId}`);
    res.json({
      success: true,
      message: 'Cachet/signature mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour cachet/signature:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE /api/users/logo - Supprimer le logo
app.delete('/api/users/logo', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  
  try {
    // Vérifier si l'owner existe
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
    
    await pool.query(
      'UPDATE users SET logoBase64 = NULL, updatedAt = NOW() WHERE id = ?',
      [targetUserId]
    );
    
    console.log(`✅ [API] Logo supprimé pour userId=${targetUserId}`);
    res.json({
      success: true,
      message: 'Logo supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression logo:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE /api/users/signature - Supprimer le cachet/signature
app.delete('/api/users/signature', authMiddleware, async (req, res) => {
  // ✅ Essayer d'abord avec ownerId, puis avec userId si owner n'existe pas
  const ownerId = req.ownerId || req.userId;
  const currentUserId = req.originalUserId || req.userId;
  
  try {
    // Vérifier si l'owner existe
    const [ownerCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [ownerId]);
    const targetUserId = ownerCheck.length > 0 ? ownerId : currentUserId;
    
    await pool.query(
      'UPDATE users SET signatureCachetBase64 = NULL, updatedAt = NOW() WHERE id = ?',
      [targetUserId]
    );
    
    console.log(`✅ [API] Cachet/signature supprimé pour userId=${targetUserId}`);
    res.json({
      success: true,
      message: 'Cachet/signature supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression cachet/signature:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ==================== GESTION DES UTILISATEURS ====================

// GET /api/users - Récupérer tous les utilisateurs avec le même ownerId
app.get('/api/users', authMiddleware, async (req, res) => {
  console.log('🔍 [API] GET /api/users - Début de la requête');
  // ✅ FIX: Utiliser originalUserId au lieu de userId
  // Car le middleware auth remplace userId par ownerId pour le partage de données
  const userId = req.originalUserId || req.userId;
  console.log(`🔍 [API] userId extrait du JWT: ${userId} (originalUserId: ${req.originalUserId}, userId: ${req.userId})`);
  
  try {
    // 1. Récupérer l'ownerId de l'utilisateur actuel
    console.log(`🔍 [API] Recherche de l'utilisateur avec id=${userId}`);
    const [currentUser] = await pool.query(
      'SELECT id, ownerId, role FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`🔍 [API] Résultat de la recherche:`, currentUser);
    
    if (currentUser.length === 0) {
      console.log(`❌ [API] Utilisateur ${userId} non trouvé dans la base`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = currentUser[0];
    const ownerIdToUse = user.ownerId || user.id;
    console.log(`🔍 [API] ownerId à utiliser: ${ownerIdToUse} (user.ownerId=${user.ownerId}, user.id=${user.id})`);
    
    // 2. Récupérer TOUS les utilisateurs avec le même ownerId
    console.log(`🔍 [API] Recherche de tous les utilisateurs avec ownerId=${ownerIdToUse}`);
    const [users] = await pool.query(
      `SELECT id, username, email, nom, prenom, telephone, adresse, role, ownerId, isActive, lastLogin, createdAt, updatedAt 
       FROM users 
       WHERE ownerId = ?
       ORDER BY role DESC, createdAt ASC`,
      [ownerIdToUse]
    );
    
    console.log(`✅ [API] ${users.length} utilisateur(s) récupéré(s) pour ownerId=${ownerIdToUse}`);
    res.json(users);
  } catch (error) {
    console.error('❌ [API] Erreur récupération utilisateurs:', error);
    console.error('❌ [API] Stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});


// POST /api/users/clone - Créer un nouvel utilisateur avec le MÊME ownerId
// Cela permet de partager toutes les données (ventes, achats, clients, etc.)
app.post('/api/users/clone', authMiddleware, async (req, res) => {
  // ✅ FIX: Utiliser originalUserId pour obtenir l'ID réel de l'utilisateur connecté
  const currentUserId = req.originalUserId || req.userId;
  const { username, password, role } = req.body;
  
  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password sont requis' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  
  if (!role || !['admin', 'vendeur'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide (admin ou vendeur)' });
  }
  
  try {
    // 1. Vérifier si le username existe déjà
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }
    
    // 2. Récupérer l'ownerId de l'utilisateur actuel
    const [currentUser] = await pool.query(
      'SELECT id, ownerId, role FROM users WHERE id = ?',
      [currentUserId]
    );
    
    if (currentUser.length === 0) {
      return res.status(404).json({ error: 'Utilisateur actuel non trouvé' });
    }
    
    const user = currentUser[0];
    // L'ownerId à utiliser est celui de l'utilisateur actuel
    // Si l'utilisateur actuel est admin, son ownerId = son id
    const ownerIdToUse = user.ownerId || user.id;
    
    // 3. ✅ Hasher le mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 4. ✅ Créer un nouvel utilisateur avec le MÊME ownerId
    // Cela permet de partager toutes les données (toutes les tables sont filtrées par ownerId)
    const generatedEmail = `${username}@local.app`;
    
    console.log(`📝 [API] Création utilisateur avec:`);
    console.log(`   - username: ${username}`);
    console.log(`   - email: ${generatedEmail}`);
    console.log(`   - role: ${role}`);
    console.log(`   - ownerId: ${ownerIdToUse}`);
    
    const [result] = await pool.query(
      `INSERT INTO users (
        username, password, email, role, ownerId, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        username, // Nouveau username
        hashedPassword, // ✅ Mot de passe hashé
        generatedEmail, // Email généré unique
        role, // Nouveau role
        ownerIdToUse, // ✅ MÊME ownerId que l'utilisateur actuel
        1 // isActive
      ]
    );
    
    console.log(`✅ [API] Utilisateur créé: ${username} (id=${result.insertId}, role=${role}, ownerId=${ownerIdToUse})`);
    console.log(`   → Partage des données avec ownerId=${ownerIdToUse}`);
    console.log(`   → Mot de passe hashé avec bcrypt`);
    
    // ✅ FIX: Mettre à jour le rôle après l'insertion (contournement du trigger)
    await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, result.insertId]
    );
    console.log(`🔧 [API] Rôle mis à jour après insertion: ${role}`);
    
    // Vérifier que le rôle a bien été enregistré
    const [checkUser] = await pool.query(
      'SELECT id, username, role, ownerId FROM users WHERE id = ?',
      [result.insertId]
    );
    console.log(`🔍 [API] Vérification utilisateur créé:`, checkUser[0]);
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      userId: result.insertId,
      ownerId: ownerIdToUse,
      sharedData: true
    });
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/users/:id - Modifier un utilisateur
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  const currentUserId = req.userId;
  const userIdToUpdate = parseInt(req.params.id);
  const { username, password, role } = req.body;
  
  try {
    // Vérifier que l'utilisateur à modifier appartient au même groupe (ownerId)
    const [currentUser] = await pool.query(
      'SELECT ownerId FROM users WHERE id = ?',
      [req.originalUserId] // Utiliser l'ID original, pas celui remplacé par le middleware
    );
    
    const [targetUser] = await pool.query(
      'SELECT ownerId FROM users WHERE id = ?',
      [userIdToUpdate]
    );
    
    if (currentUser.length === 0 || targetUser.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const currentOwnerId = currentUser[0].ownerId || req.originalUserId;
    const targetOwnerId = targetUser[0].ownerId;
    
    if (currentOwnerId !== targetOwnerId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier cet utilisateur' });
    }
    
    // Construire la requête de mise à jour
    const updates = [];
    const values = [];
    
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }
    
    updates.push('updatedAt = NOW()');
    values.push(userIdToUpdate);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    console.log(`✅ [API] Utilisateur ${userIdToUpdate} modifié`);
    res.json({ success: true, message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  const currentUserId = req.userId;
  const userIdToDelete = parseInt(req.params.id);
  
  try {
    // Ne pas permettre de supprimer son propre compte
    if (req.originalUserId === userIdToDelete) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    // Vérifier que l'utilisateur à supprimer appartient au même groupe (ownerId)
    const [currentUser] = await pool.query(
      'SELECT ownerId FROM users WHERE id = ?',
      [req.originalUserId]
    );
    
    const [targetUser] = await pool.query(
      'SELECT ownerId, username FROM users WHERE id = ?',
      [userIdToDelete]
    );
    
    if (currentUser.length === 0 || targetUser.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const currentOwnerId = currentUser[0].ownerId || req.originalUserId;
    const targetOwnerId = targetUser[0].ownerId;
    
    if (currentOwnerId !== targetOwnerId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer cet utilisateur' });
    }
    
    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = ?', [userIdToDelete]);
    
    console.log(`✅ [API] Utilisateur ${targetUser[0].username} (id=${userIdToDelete}) supprimé`);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET /api/users/:id - Récupérer un utilisateur spécifique (avec licence)
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  const userIdToGet = parseInt(req.params.id);
  
  try {
    console.log(`🔍 [API] GET /api/users/${userIdToGet} - Récupération utilisateur`);
    
    const [users] = await pool.query(
      'SELECT id, username, email, nom, prenom, telephone, adresse, role, ownerId, isActive, license, lastLogin, createdAt, updatedAt FROM users WHERE id = ?',
      [userIdToGet]
    );
    
    if (users.length === 0) {
      console.log(`❌ [API] Utilisateur ${userIdToGet} non trouvé`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ [API] Utilisateur ${userIdToGet} récupéré (license: ${users[0].license ? 'présente' : 'vide'})`);
    res.json(users[0]);
  } catch (error) {
    console.error('❌ [API] Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/users/:id/license - Mettre à jour la licence d'un utilisateur
app.put('/api/users/:id/license', authMiddleware, async (req, res) => {
  const userIdToUpdate = parseInt(req.params.id);
  const { license } = req.body;
  
  try {
    console.log(`🔐 [API] PUT /api/users/${userIdToUpdate}/license - Mise à jour licence`);
    
    if (!license) {
      return res.status(400).json({ error: 'La licence est requise' });
    }
    
    // Vérifier que l'utilisateur existe
    const [users] = await pool.query(
      'SELECT id, username FROM users WHERE id = ?',
      [userIdToUpdate]
    );
    
    if (users.length === 0) {
      console.log(`❌ [API] Utilisateur ${userIdToUpdate} non trouvé`);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour la licence
    await pool.query(
      'UPDATE users SET license = ?, updatedAt = NOW() WHERE id = ?',
      [license, userIdToUpdate]
    );
    
    console.log(`✅ [API] Licence mise à jour pour utilisateur ${users[0].username} (id=${userIdToUpdate})`);
    console.log(`   Licence: ${license.substring(0, 16)}...`);
    
    res.json({ 
      success: true, 
      message: 'Licence enregistrée avec succès',
      userId: userIdToUpdate
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour licence:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ❌ DÉSACTIVÉ : Création d'utilisateurs
// Les utilisateurs doivent être créés par un administrateur via un autre moyen
// app.post('/api/users', authMiddleware, requireRole('admin'), async (req, res) => { ... });

// ❌ DÉSACTIVÉ : Modification d'utilisateurs
// Chaque utilisateur ne peut voir que lui-même, pas besoin de modifier d'autres utilisateurs
// app.put('/api/users/:id', authMiddleware, requireRole('admin'), async (req, res) => { ... });

// ❌ DÉSACTIVÉ : Suppression d'utilisateurs
// Chaque utilisateur ne peut voir que lui-même, pas besoin de supprimer d'autres utilisateurs
// app.delete('/api/users/:id', authMiddleware, requireRole('admin'), async (req, res) => { ... });

app.listen(PORT, () => {
  console.log(`✅ API MySQL démarrée sur http://localhost:${PORT}`);
});
