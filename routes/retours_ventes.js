const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET tous les retours de vente
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM retours_ventes ORDER BY dateRetour DESC LIMIT 500');
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /retours_ventes:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET un retour de vente par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Retour de vente non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /retours_ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST créer un retour de vente
router.post('/', async (req, res) => {
  try {
    const {
      id,
      userId = 1,
      marchandiseId,
      venteId,
      clientId,
      dateRetour,
      montantTotal,
      statut = 'valide',
      raison,
      notes,
      deviceId,
    } = req.body;

    if (!marchandiseId || !venteId || !dateRetour || montantTotal === undefined) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const now = new Date();

    // Si un ID est fourni (sync depuis SQLite)
    let query, params;
    if (id) {
      query = `INSERT INTO retours_ventes 
        (id, userId, marchandiseId, venteId, clientId, dateRetour, montantTotal, statut, raison, notes, deviceId, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          userId = VALUES(userId),
          marchandiseId = VALUES(marchandiseId),
          venteId = VALUES(venteId),
          clientId = VALUES(clientId),
          dateRetour = VALUES(dateRetour),
          montantTotal = VALUES(montantTotal),
          statut = VALUES(statut),
          raison = VALUES(raison),
          notes = VALUES(notes),
          deviceId = VALUES(deviceId),
          lastModified = VALUES(lastModified)`;
      params = [id, userId, marchandiseId, venteId, clientId, dateRetour, montantTotal, statut, raison, notes, deviceId, now];
    } else {
      query = `INSERT INTO retours_ventes 
        (userId, marchandiseId, venteId, clientId, dateRetour, montantTotal, statut, raison, notes, deviceId, lastModified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [userId, marchandiseId, venteId, clientId, dateRetour, montantTotal, statut, raison, notes, deviceId, now];
    }

    const [result] = await pool.query(query, params);
    const insertedId = id || result.insertId;

    const [rows] = await pool.query('SELECT * FROM retours_ventes WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Erreur POST /retours_ventes:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT mettre à jour un retour de vente
router.put('/:id', async (req, res) => {
  try {
    const {
      userId,
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
         userId = COALESCE(?, userId),
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
      [userId, marchandiseId, venteId, clientId, dateRetour, montantTotal, statut, raison, notes, deviceId, now, req.params.id],
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

// DELETE supprimer un retour de vente
router.delete('/:id', async (req, res) => {
  try {
    // Supprimer les lignes de retour associées d'abord
    await pool.query('DELETE FROM lignes_retour_vente WHERE retourVenteId = ?', [req.params.id]);

    const [result] = await pool.query('DELETE FROM retours_ventes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Retour de vente non trouvé' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /retours_ventes/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
