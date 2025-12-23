const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// ==================== REGLEMENTS FOURNISSEURS ====================

// GET - Récupérer tous les règlements fournisseurs
router.get('/', async (req, res) => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reglements_fournisseurs ORDER BY dateReglement DESC LIMIT 1000'
      );
      res.json(rows);
      return;
    } catch (e) {
      retries++;
      console.error(`Erreur GET /reglements_fournisseurs (tentative ${retries}/${maxRetries}):`, e);
      
      if ((e.code === 'PROTOCOL_CONNECTION_LOST' || 
           e.code === 'ETIMEDOUT' ||
           e.code === 'ER_NET_READ_INTERRUPTED') && 
          retries < maxRetries) {
        const delaySeconds = retries * 3;
        console.log(`🔄 Reconnexion dans ${delaySeconds} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        continue;
      }
      
      res.status(500).json({ error: e.message });
      return;
    }
  }
});

// GET - Récupérer un règlement fournisseur par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Règlement fournisseur non trouvé' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /reglements_fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST - Créer un nouveau règlement fournisseur
router.post('/', async (req, res) => {
  try {
    // Extraire uniquement les champs nécessaires (ignorer action, id, etc.)
    const {
      marchandiseId = 1,
      fournisseurId,
      achatId = null,
      dateReglement = new Date(),
      montant,
      modePaiement = 'espece',
      reference = null,
      notes = null,
      deviceId = null,
      // Ignorer les champs supplémentaires qui peuvent venir de DeltaChanges
      action, // ignoré
      id, // ignoré
      userId, // ignoré
      ...rest // ignorer tout le reste
    } = req.body;

    if (!fournisseurId || montant == null) {
      return res.status(400).json({ 
        error: 'fournisseurId et montant sont obligatoires' 
      });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO reglements_fournisseurs
       (marchandiseId, fournisseurId, achatId, dateReglement, montant,
        modePaiement, reference, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        marchandiseId, fournisseurId, achatId, dateReglement, montant,
        modePaiement, reference, notes, deviceId, now
      ]
    );

    // Enregistrer dans l'historique
    await pool.query(
      `INSERT INTO historique_reglements_fournisseurs
       (reglementId, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, action, dateAction, deviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'create', ?, ?)`,
      [
        result.insertId, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, now, deviceId
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /reglements_fournisseurs:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT - Mettre à jour un règlement fournisseur
router.put('/:id', async (req, res) => {
  try {
    const {
      marchandiseId = 1,
      fournisseurId,
      achatId,
      dateReglement,
      montant,
      modePaiement,
      reference,
      notes,
    } = req.body;

    const now = new Date();
    
    // Utiliser INSERT ... ON DUPLICATE KEY UPDATE pour un véritable UPSERT
    await pool.query(
      `INSERT INTO reglements_fournisseurs
       (id, marchandiseId, fournisseurId, achatId, dateReglement, montant,
        modePaiement, reference, notes, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         marchandiseId = COALESCE(VALUES(marchandiseId), marchandiseId),
         fournisseurId = COALESCE(VALUES(fournisseurId), fournisseurId),
         achatId = COALESCE(VALUES(achatId), achatId),
         dateReglement = COALESCE(VALUES(dateReglement), dateReglement),
         montant = COALESCE(VALUES(montant), montant),
         modePaiement = COALESCE(VALUES(modePaiement), modePaiement),
         reference = COALESCE(VALUES(reference), reference),
         notes = COALESCE(VALUES(notes), notes),
         lastModified = VALUES(lastModified)`,
      [
        req.params.id, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, now
      ]
    );

    // Enregistrer dans l'historique
    await pool.query(
      `INSERT INTO historique_reglements_fournisseurs
       (reglementId, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, action, dateAction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'update', ?)`,
      [
        req.params.id, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, now
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /reglements_fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE - Supprimer un règlement fournisseur
router.delete('/:id', async (req, res) => {
  try {
    // Récupérer les données avant suppression pour l'historique
    const [reglement] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE id = ?',
      [req.params.id]
    );

    if (reglement.length === 0) {
      return res.status(404).json({ error: 'Règlement fournisseur non trouvé' });
    }

    const r = reglement[0];
    const now = new Date();

    // Enregistrer dans l'historique avant suppression
    await pool.query(
      `INSERT INTO historique_reglements_fournisseurs
       (reglementId, marchandiseId, fournisseurId, achatId, dateReglement,
        montant, modePaiement, reference, notes, action, dateAction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'delete', ?)`,
      [
        r.id, r.marchandiseId, r.fournisseurId, r.achatId, r.dateReglement,
        r.montant, r.modePaiement, r.reference, r.notes, now
      ]
    );

    // Supprimer le règlement
    const [result] = await pool.query(
      'DELETE FROM reglements_fournisseurs WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /reglements_fournisseurs/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET - Récupérer les règlements d'un fournisseur spécifique
router.get('/fournisseur/:fournisseurId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE fournisseurId = ? ORDER BY dateReglement DESC',
      [req.params.fournisseurId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /reglements_fournisseurs/fournisseur/:fournisseurId:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET - Récupérer les règlements d'un achat spécifique
router.get('/achat/:achatId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reglements_fournisseurs WHERE achatId = ? ORDER BY dateReglement DESC',
      [req.params.achatId]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /reglements_fournisseurs/achat/:achatId:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
