// ============================================================================
// Middleware: Remplacer userId par ownerId automatiquement
// ============================================================================
// Ce middleware récupère automatiquement l'ownerId de l'utilisateur connecté
// et REMPLACE req.userId par req.ownerId pour partager les données
// AUCUNE modification des routes nécessaire !

const addOwnerIdMiddleware = (pool) => {
  return async (req, res, next) => {
    // Si l'utilisateur est authentifié (userId existe)
    if (req.userId) {
      try {
        // Sauvegarder l'userId original
        req.originalUserId = req.userId;
        
        // Récupérer l'ownerId de l'utilisateur connecté
        const [users] = await pool.query(
          'SELECT ownerId FROM users WHERE id = ?',
          [req.userId]
        );

        if (users.length > 0 && users[0].ownerId) {
          // ✅ REMPLACER userId par ownerId pour partager les données
          req.userId = users[0].ownerId;
          req.ownerId = users[0].ownerId;
          console.log(`🔄 [MIDDLEWARE] userId ${req.originalUserId} → ownerId ${req.ownerId}`);
        } else {
          // Si pas de ownerId, garder userId
          req.ownerId = req.userId;
        }
      } catch (error) {
        console.error('❌ Erreur récupération ownerId:', error);
        // En cas d'erreur, garder userId
        req.ownerId = req.userId;
      }
    }

    next();
  };
};

module.exports = { addOwnerIdMiddleware };
