const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET toutes les lignes de retour achat
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lignes_retour_achat ORDER BY id DESC LIMIT 1000');
    res.json(rows);
  } catch (e) {
    console.error('Erreur GET /lignes_retour_achat:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET une ligne de retour achat par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lignes_retour_achat WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Ligne de retour achat non trouvée' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur GET /lignes_retour_achat/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST créer une ligne de retour achat
router.post('/', async (req, res) => {
  try {
    const {
      retourAchatId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
      userId = 1,
    } = req.body;

    if (!retourAchatId || !produitId || quantite == null || prixUnitaire == null) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const [result] = await pool.query(
      `INSERT INTO lignes_retour_achat (retourAchatId, produitId, quantite, prixUnitaire, montantLigne, userId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         quantite = VALUES(quantite),
         prixUnitaire = VALUES(prixUnitaire),
         montantLigne = VALUES(montantLigne)`,
      [retourAchatId, produitId, quantite, prixUnitaire, montantLigne || (quantite * prixUnitaire), userId],
    );

    const lineId = result.insertId || (await pool.query(
      'SELECT id FROM lignes_retour_achat WHERE retourAchatId = ? AND produitId = ?',
      [retourAchatId, produitId]
    ))[0][0]?.id;

    const [rows] = await pool.query('SELECT * FROM lignes_retour_achat WHERE id = ?', [lineId || result.insertId]);
    res.status(201).json(rows[0] || rows);
  } catch (e) {
    console.error('Erreur POST /lignes_retour_achat:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT mettre à jour une ligne de retour achat
router.put('/:id', async (req, res) => {
  try {
    const {
      quantite,
      prixUnitaire,
      montantLigne,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE lignes_retour_achat SET
         quantite = COALESCE(?, quantite),
         prixUnitaire = COALESCE(?, prixUnitaire),
         montantLigne = COALESCE(?, montantLigne)
       WHERE id = ?`,
      [quantite, prixUnitaire, montantLigne, req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ligne de retour achat non trouvée' });
    }

    const [rows] = await pool.query('SELECT * FROM lignes_retour_achat WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('Erreur PUT /lignes_retour_achat/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE supprimer une ligne de retour achat
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM lignes_retour_achat WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ligne de retour achat non trouvée' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Erreur DELETE /lignes_retour_achat/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
