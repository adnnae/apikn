const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET tous les retours d'achat
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM retours_achats ORDER BY dateRetour DESC LIMIT 500');
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /retours_achats:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET un retour d'achat par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Retour d\'achat non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /retours_achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST créer un retour d'achat
router.post('/', async (req, res) => {
  try {
    const {
      id,
      userId = 1,
      marchandiseId,
      achatId,
      fournisseurId,
      dateRetour,
      montantTotal,
      statut = 'valide',
      raison,
      notes,
      deviceId,
    } = req.body;

    if (!marchandiseId || !achatId || !dateRetour || montantTotal === undefined) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const now = new Date();

    // Si un ID est fourni (sync depuis SQLite)
    let query, params;
    if (id) {
      query = `INSERT INTO retours_achats 
        (id, userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal, statut, raison, notes, deviceId, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          userId = VALUES(userId),
          marchandiseId = VALUES(marchandiseId),
          achatId = VALUES(achatId),
          fournisseurId = VALUES(fournisseurId),
          dateRetour = VALUES(dateRetour),
          montantTotal = VALUES(montantTotal),
          statut = VALUES(statut),
          raison = VALUES(raison),
          notes = VALUES(notes),
          deviceId = VALUES(deviceId),
          lastModified = VALUES(lastModified)`;
      params = [id, userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal, statut, raison, notes, deviceId, now];
    } else {
      query = `INSERT INTO retours_achats 
        (userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal, statut, raison, notes, deviceId, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal, statut, raison, notes, deviceId, now];
    }

    const [result] = await pool.query(query, params);
    const insertedId = id || result.insertId;

    const [rows] = await pool.query('SELECT * FROM retours_achats WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /retours_achats:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT mettre à jour un retour d'achat
router.put('/:id', async (req, res) => {
  try {
    const {
      userId,
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
         userId = COALESCE(?, userId),
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
      [userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal, statut, raison, notes, deviceId, now, req.params.id],
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

// DELETE supprimer un retour d'achat
router.delete('/:id', async (req, res) => {
  try {
    // Supprimer les lignes de retour associées d'abord
    await pool.query('DELETE FROM lignes_retour_achat WHERE retourAchatId = ?', [req.params.id]);

    const [result] = await pool.query('DELETE FROM retours_achats WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour d\'achat non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /retours_achats/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
