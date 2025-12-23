-- ============================================================================
-- SCRIPT SQL: Correction des tables manquantes (userId)
-- ============================================================================
-- Ce script ajoute userId aux tables qui ont échoué lors du premier script
-- ============================================================================

-- Vérifier d'abord si l'utilisateur admin existe
SELECT id, username FROM users WHERE id = 1;

-- ============================================================================
-- AJOUTER userId AUX TABLES QUI ONT ÉCHOUÉ
-- ============================================================================

-- Table: historique_reglements_clients
ALTER TABLE historique_reglements_clients 
  ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1 AFTER id;

ALTER TABLE historique_reglements_clients 
  ADD INDEX IF NOT EXISTS idx_userId (userId);

ALTER TABLE historique_reglements_clients 
  ADD CONSTRAINT IF NOT EXISTS fk_hist_regl_clients_userId 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: historique_reglements_fournisseurs
ALTER TABLE historique_reglements_fournisseurs 
  ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1 AFTER id;

ALTER TABLE historique_reglements_fournisseurs 
  ADD INDEX IF NOT EXISTS idx_userId (userId);

ALTER TABLE historique_reglements_fournisseurs 
  ADD CONSTRAINT IF NOT EXISTS fk_hist_regl_fournisseurs_userId 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: reglements_clients
ALTER TABLE reglements_clients 
  ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1 AFTER id;

ALTER TABLE reglements_clients 
  ADD INDEX IF NOT EXISTS idx_userId (userId);

ALTER TABLE reglements_clients 
  ADD CONSTRAINT IF NOT EXISTS fk_reglements_clients_userId 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: reglements_fournisseurs
ALTER TABLE reglements_fournisseurs 
  ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1 AFTER id;

ALTER TABLE reglements_fournisseurs 
  ADD INDEX IF NOT EXISTS idx_userId (userId);

ALTER TABLE reglements_fournisseurs 
  ADD CONSTRAINT IF NOT EXISTS fk_reglements_fournisseurs_userId 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que TOUTES les tables ont userId
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'userId'
ORDER BY TABLE_NAME;

-- Compter combien de tables ont userId
SELECT COUNT(DISTINCT TABLE_NAME) AS nb_tables_avec_userId
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'userId';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
