// ============================================================================
// Routes: Authentification (Login, Register, Refresh, etc.)
// ============================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { 
  generateToken, 
  generateRefreshToken, 
  verifyToken,
  authMiddleware 
} = require('../middleware/auth');

// Pool de connexion MySQL (importé depuis server.js)
let pool;

// Initialiser le pool
const initPool = (dbPool) => {
  pool = dbPool;
};

// ============================================================================
// POST /api/auth/register - Inscription d'un nouvel utilisateur
// ============================================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, nom, prenom, telephone, adresse } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Username, email et password sont requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Utilisateur existant',
        message: 'Ce username ou email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, nom, prenom, telephone, adresse, role, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'user', true)`,
      [username, email, hashedPassword, nom || null, prenom || null, telephone || null, adresse || null]
    );

    const userId = result.insertId;

    // Récupérer l'utilisateur créé
    const [users] = await pool.query(
      'SELECT id, username, email, nom, prenom, telephone, adresse, role, isActive, createdAt FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0];

    // Générer les tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ [REGISTER] Nouvel utilisateur créé: ${username} (ID: ${userId})`);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('❌ [REGISTER] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/auth/login - Connexion
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Username et password sont requis'
      });
    }

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Identifiants invalides',
        message: 'Username ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Compte désactivé',
        message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Identifiants invalides',
        message: 'Username ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    await pool.query(
      'UPDATE users SET lastLogin = NOW() WHERE id = ?',
      [user.id]
    );

    // Générer les tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ [LOGIN] Utilisateur connecté: ${user.username} (ID: ${user.id})`);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        role: user.role
      },
      token,
      refreshToken
    });

  } catch (error) {
    console.error('❌ [LOGIN] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/auth/refresh - Rafraîchir le token
// ============================================================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Token manquant',
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Le refresh token est invalide ou expiré'
      });
    }

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT id, username, email, nom, prenom, role, isActive FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0 || !users[0].isActive) {
      return res.status(401).json({ 
        error: 'Utilisateur invalide',
        message: 'L\'utilisateur n\'existe plus ou est désactivé'
      });
    }

    const user = users[0];

    // Générer un nouveau token
    const newToken = generateToken(user);

    console.log(`✅ [REFRESH] Token rafraîchi pour: ${user.username} (ID: ${user.id})`);

    res.json({
      message: 'Token rafraîchi',
      token: newToken
    });

  } catch (error) {
    console.error('❌ [REFRESH] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// GET /api/auth/me - Obtenir les informations de l'utilisateur connecté
// ============================================================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT id, username, email, nom, prenom, telephone, adresse, role, isActive, createdAt, lastLogin FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        message: 'L\'utilisateur n\'existe pas'
      });
    }

    res.json({
      user: users[0]
    });

  } catch (error) {
    console.error('❌ [ME] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// PUT /api/auth/profile - Mettre à jour le profil
// ============================================================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { nom, prenom, telephone, adresse, email } = req.body;

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          error: 'Email déjà utilisé',
          message: 'Cet email est déjà utilisé par un autre utilisateur'
        });
      }
    }

    // Mettre à jour le profil
    await pool.query(
      `UPDATE users 
       SET nom = ?, prenom = ?, telephone = ?, adresse = ?, email = COALESCE(?, email)
       WHERE id = ?`,
      [nom, prenom, telephone, adresse, email, userId]
    );

    // Récupérer l'utilisateur mis à jour
    const [users] = await pool.query(
      'SELECT id, username, email, nom, prenom, telephone, adresse, role FROM users WHERE id = ?',
      [userId]
    );

    console.log(`✅ [PROFILE] Profil mis à jour pour: ${users[0].username} (ID: ${userId})`);

    res.json({
      message: 'Profil mis à jour avec succès',
      user: users[0]
    });

  } catch (error) {
    console.error('❌ [PROFILE] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// PUT /api/auth/password - Changer le mot de passe
// ============================================================================
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Mot de passe trop court',
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT id, username, password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Mot de passe incorrect',
        message: 'Le mot de passe actuel est incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    console.log(`✅ [PASSWORD] Mot de passe changé pour: ${user.username} (ID: ${userId})`);

    res.json({
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('❌ [PASSWORD] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/auth/logout - Déconnexion (optionnel - côté client)
// ============================================================================
router.post('/logout', authMiddleware, (req, res) => {
  // La déconnexion est gérée côté client en supprimant le token
  // Cette route est optionnelle et peut être utilisée pour des logs
  console.log(`✅ [LOGOUT] Utilisateur déconnecté: ${req.user.username} (ID: ${req.userId})`);
  
  res.json({
    message: 'Déconnexion réussie'
  });
});

module.exports = { router, initPool };
