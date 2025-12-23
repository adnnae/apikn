-- ============================================================================
-- SCRIPT SQL: Création table USERS et ajout colonne userId à toutes les tables
-- ============================================================================
-- Date: 20 Décembre 2025
-- Description: Sécurisation multi-utilisateurs avec JWT
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: CRÉER LA TABLE USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt du mot de passe',
  nom VARCHAR(100),
  prenom VARCHAR(100),
  telephone VARCHAR(20),
  adresse TEXT,
  role ENUM('admin', 'user', 'manager') DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_isActive (isActive),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 2: AJOUTER LA COLONNE userId À TOUTES LES TABLES
-- ============================================================================

-- Table: achats
ALTER TABLE achats 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_achats_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: categories
ALTER TABLE categories 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_categories_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: clients
ALTER TABLE clients 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_clients_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: depenses
ALTER TABLE depenses 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_depenses_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: fournisseurs
ALTER TABLE fournisseurs 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_fournisseurs_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: historique_reglements_clients
ALTER TABLE historique_reglements_clients 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_hist_regl_clients_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: historique_reglements_fournisseurs
ALTER TABLE historique_reglements_fournisseurs 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_hist_regl_fournisseurs_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: lignes_achat
ALTER TABLE lignes_achat 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_lignes_achat_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: lignes_retour_achat
ALTER TABLE lignes_retour_achat 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_lignes_retour_achat_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: lignes_retour_vente
ALTER TABLE lignes_retour_vente 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_lignes_retour_vente_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: lignes_vente
ALTER TABLE lignes_vente 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_lignes_vente_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: produits
ALTER TABLE produits 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_produits_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: reglements_clients
ALTER TABLE reglements_clients 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_reglements_clients_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: reglements_fournisseurs
ALTER TABLE reglements_fournisseurs 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_reglements_fournisseurs_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: retours_achats
ALTER TABLE retours_achats 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_retours_achats_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: retours_ventes
ALTER TABLE retours_ventes 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_retours_ventes_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: sync_metadata
ALTER TABLE sync_metadata 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_sync_metadata_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- Table: ventes
ALTER TABLE ventes 
  ADD COLUMN userId INT NOT NULL DEFAULT 1 AFTER id,
  ADD INDEX idx_userId (userId),
  ADD CONSTRAINT fk_ventes_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- ÉTAPE 3: CRÉER UN UTILISATEUR PAR DÉFAUT (ADMIN)
-- ============================================================================
-- Mot de passe: admin123 (hashé avec bcrypt)
-- IMPORTANT: Changez ce mot de passe en production!

INSERT INTO users (username, email, password, nom, prenom, role, isActive) 
VALUES (
  'admin',
  'admin@knachsoft.com',
  '$2a$10$rZ5qYXKzXqXqXqXqXqXqXeO5qYXKzXqXqXqXqXqXqXqXqXqXqXqXq', -- Placeholder - sera remplacé par le vrai hash
  'Administrateur',
  'Système',
  'admin',
  true
);

-- ============================================================================
-- ÉTAPE 4: VÉRIFICATION
-- ============================================================================

-- Vérifier que la table users existe
SELECT 'Table users créée avec succès' AS status, COUNT(*) AS nb_users FROM users;

-- Vérifier que toutes les tables ont la colonne userId
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'userId'
ORDER BY TABLE_NAME;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
/*
1. DEFAULT 1: Toutes les données existantes seront assignées à userId=1 (admin)
   
2. ON DELETE CASCADE: Si un utilisateur est supprimé, toutes ses données sont supprimées
   Alternatives:
   - ON DELETE RESTRICT: Empêche la suppression si des données existent
   - ON DELETE SET NULL: Met userId à NULL (nécessite de retirer NOT NULL)

3. FOREIGN KEY: Garantit l'intégrité référentielle
   - Impossible d'insérer des données avec un userId inexistant
   - Impossible de supprimer un user qui a des données (si RESTRICT)

4. INDEX: Améliore les performances des requêtes WHERE userId = ?

5. Mot de passe admin: Le hash placeholder doit être remplacé par un vrai hash bcrypt
   Utilisez le script Node.js fourni pour créer le premier utilisateur

6. Migration des données: Si vous avez des données existantes, elles seront toutes
   assignées à userId=1. Vous devrez peut-être les réassigner manuellement.
*/

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
