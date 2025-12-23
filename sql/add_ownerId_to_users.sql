-- ============================================
-- Script pour ajouter la colonne ownerId
-- ============================================
-- Cette colonne permet de lier les vendeurs à leur admin propriétaire
-- Tous les utilisateurs (admin + vendeurs) partagent le même ownerId
-- pour accéder aux mêmes données (ventes, achats, clients, etc.)

-- 1. Ajouter la colonne ownerId (si elle n'existe pas déjà)
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'ownerId'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE users ADD COLUMN ownerId INT DEFAULT NULL AFTER id',
  'SELECT "Colonne ownerId existe déjà" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Pour les admins existants, définir ownerId = id (ils sont leur propre propriétaire)
UPDATE users SET ownerId = id WHERE role = 'admin' AND ownerId IS NULL;

-- 3. Créer un index pour améliorer les performances (si il n'existe pas)
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users' 
  AND INDEX_NAME = 'idx_users_ownerId'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_users_ownerId ON users(ownerId)',
  'SELECT "Index idx_users_ownerId existe déjà" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Vérification finale
SELECT 
  'Configuration ownerId terminée' AS status,
  COUNT(*) AS total_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins,
  SUM(CASE WHEN role = 'vendeur' THEN 1 ELSE 0 END) AS vendeurs,
  SUM(CASE WHEN ownerId IS NOT NULL THEN 1 ELSE 0 END) AS users_with_ownerId
FROM users;

-- 5. Afficher les utilisateurs
SELECT id, username, role, ownerId FROM users ORDER BY ownerId, role;
