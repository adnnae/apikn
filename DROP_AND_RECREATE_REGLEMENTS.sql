-- ==========================================
-- SCRIPT POUR SUPPRIMER ET RECRÉER LES TABLES DE RÈGLEMENTS
-- Base de données: default_db
-- ==========================================

USE default_db;

-- ==========================================
-- ÉTAPE 1: SUPPRIMER LES ANCIENNES TABLES
-- ==========================================

DROP TABLE IF EXISTS historique_reglements_fournisseurs;
DROP TABLE IF EXISTS historique_reglements_clients;
DROP TABLE IF EXISTS reglements_fournisseurs;
DROP TABLE IF EXISTS reglements_clients;

-- ==========================================
-- ÉTAPE 2: CRÉER LES NOUVELLES TABLES
-- ==========================================

-- Table ReglementsClients
CREATE TABLE reglements_clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marchandiseId INT NOT NULL,
  clientId INT NOT NULL,
  venteId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50) DEFAULT 'espece',
  reference VARCHAR(255),
  notes TEXT,
  deviceId VARCHAR(100),
  lastModified DATETIME,
  INDEX idx_client (clientId),
  INDEX idx_vente (venteId),
  INDEX idx_date (dateReglement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table ReglementsFournisseurs
CREATE TABLE reglements_fournisseurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marchandiseId INT NOT NULL,
  fournisseurId INT NOT NULL,
  achatId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50) DEFAULT 'espece',
  reference VARCHAR(255),
  notes TEXT,
  deviceId VARCHAR(100),
  lastModified DATETIME,
  INDEX idx_fournisseur (fournisseurId),
  INDEX idx_achat (achatId),
  INDEX idx_date (dateReglement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table HistoriqueReglementsClients (pour traçabilité)
CREATE TABLE historique_reglements_clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reglementId INT NOT NULL,
  marchandiseId INT NOT NULL,
  clientId INT NOT NULL,
  venteId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50),
  reference VARCHAR(255),
  notes TEXT,
  action VARCHAR(20) NOT NULL,
  dateAction DATETIME NOT NULL,
  deviceId VARCHAR(100),
  INDEX idx_reglement (reglementId),
  INDEX idx_date_action (dateAction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table HistoriqueReglementsFournisseurs (pour traçabilité)
CREATE TABLE historique_reglements_fournisseurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reglementId INT NOT NULL,
  marchandiseId INT NOT NULL,
  fournisseurId INT NOT NULL,
  achatId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50),
  reference VARCHAR(255),
  notes TEXT,
  action VARCHAR(20) NOT NULL,
  dateAction DATETIME NOT NULL,
  deviceId VARCHAR(100),
  INDEX idx_reglement (reglementId),
  INDEX idx_date_action (dateAction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- ÉTAPE 3: VÉRIFICATION
-- ==========================================

-- Afficher les tables créées
SHOW TABLES LIKE 'reglements_%';
SHOW TABLES LIKE 'historique_reglements_%';

-- Afficher la structure de la table d'historique clients
DESCRIBE historique_reglements_clients;
