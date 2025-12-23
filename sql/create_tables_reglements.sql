-- ==========================================
-- TABLES POUR LES REGLEMENTS CLIENTS ET FOURNISSEURS
-- ==========================================

-- Table ReglementsClients
CREATE TABLE IF NOT EXISTS reglements_clients (
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
CREATE TABLE IF NOT EXISTS reglements_fournisseurs (
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
CREATE TABLE IF NOT EXISTS historique_reglements_clients (
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
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  dateAction DATETIME NOT NULL,
  deviceId VARCHAR(100),
  INDEX idx_reglement (reglementId),
  INDEX idx_date_action (dateAction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table HistoriqueReglementsFournisseurs (pour traçabilité)
CREATE TABLE IF NOT EXISTS historique_reglements_fournisseurs (
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
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  dateAction DATETIME NOT NULL,
  deviceId VARCHAR(100),
  INDEX idx_reglement (reglementId),
  INDEX idx_date_action (dateAction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
