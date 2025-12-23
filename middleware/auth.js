// ============================================================================
// Middleware: Authentification JWT
// ============================================================================
// Ce middleware vérifie le token JWT et extrait le userId
// ============================================================================

const jwt = require('jsonwebtoken');

// Secret JWT (à mettre dans .env en production!)
const JWT_SECRET = process.env.JWT_SECRET || 'knachsoft_secret_key_change_in_production_2024';

/**
 * Middleware d'authentification JWT
 * Vérifie le token et ajoute userId et user à req
 * ✅ BONUS: Remplace automatiquement userId par ownerId pour partager les données
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token manquant',
        message: 'Veuillez fournir un token d\'authentification'
      });
    }

    // Format attendu: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        error: 'Format de token invalide',
        message: 'Le format doit être: Bearer TOKEN'
      });
    }

    const token = parts[1];

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ajouter les informations de l'utilisateur à la requête
    req.originalUserId = decoded.id; // Sauvegarder l'ID original
    req.userId = decoded.id;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };

    console.log(`✅ [AUTH] User ${decoded.username} (ID: ${decoded.id}) authentifié`);

    // ✅ PARTAGE DE DONNÉES: Remplacer userId par ownerId si l'utilisateur a un owner
    // Cela permet aux vendeurs de voir les données de leur admin
    try {
      // Récupérer le pool depuis le module db
      const { pool } = require('../db');
      
      // Vérifier que le pool existe
      if (!pool) {
        console.error('⚠️ [AUTH] Pool de connexion non disponible');
        req.ownerId = decoded.id;
      } else {
        const [users] = await pool.query(
          'SELECT ownerId FROM users WHERE id = ?',
          [decoded.id]
        );

        if (users.length > 0 && users[0].ownerId) {
          req.userId = users[0].ownerId; // ✅ Remplacer par ownerId
          req.ownerId = users[0].ownerId;
          console.log(`🔄 [AUTH] Partage de données: userId ${decoded.id} → ownerId ${users[0].ownerId}`);
        } else {
          req.ownerId = decoded.id;
          console.log(`ℹ️ [AUTH] Pas de ownerId pour userId ${decoded.id}, utilisation de userId`);
        }
      }
    } catch (dbError) {
      console.error('⚠️ [AUTH] Erreur récupération ownerId:', dbError.message);
      console.error('⚠️ [AUTH] Stack:', dbError.stack);
      req.ownerId = decoded.id; // Fallback sur userId original
    }

    // Passer au middleware suivant
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Le token fourni est invalide.'
      });
    }

    console.error('❌ [AUTH] Erreur:', error);
    return res.status(401).json({ 
      error: 'Erreur d\'authentification',
      message: error.message
    });
  }
};

/**
 * Middleware optionnel - Vérifie le rôle de l'utilisateur
 * Usage: authMiddleware, requireRole('admin'), ...
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: `Cette action nécessite le rôle: ${allowedRoles.join(' ou ')}`
      });
    }

    next();
  };
};

/**
 * Générer un token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  // Token expire dans 24 heures
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Générer un refresh token (expire dans 7 jours)
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Vérifier un token sans middleware (pour refresh)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  generateToken,
  generateRefreshToken,
  verifyToken,
  JWT_SECRET
};
