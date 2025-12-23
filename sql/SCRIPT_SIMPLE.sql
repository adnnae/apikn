-- ============================================================================
-- SCRIPT SIMPLE: Copiez-collez dans Adminer
-- ============================================================================
-- IMPORTANT: Sélectionnez d'abord la base "default_db" dans Adminer
-- ============================================================================

-- Informations de base
ALTER TABLE users ADD COLUMN nomSociete VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN raisonSociale VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN telephone VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN telephone2 VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN fixe VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN fax VARCHAR(50) NULL;

-- Adresse
ALTER TABLE users ADD COLUMN ville VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN adresseComplete TEXT NULL;

-- Informations légales
ALTER TABLE users ADD COLUMN ice VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN rc VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN if_ VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN cnss VARCHAR(50) NULL;

-- Informations bancaires
ALTER TABLE users ADD COLUMN banque VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN codeBanque VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN compteBanque VARCHAR(100) NULL;

-- Autres
ALTER TABLE users ADD COLUMN activite VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN texte TEXT NULL;

-- Images
ALTER TABLE users ADD COLUMN logoBase64 LONGTEXT NULL;
ALTER TABLE users ADD COLUMN signatureCachetBase64 LONGTEXT NULL;

-- Configuration
ALTER TABLE users ADD COLUMN devise VARCHAR(10) DEFAULT 'MAD';
ALTER TABLE users ADD COLUMN langue VARCHAR(10) DEFAULT 'fr';
ALTER TABLE users ADD COLUMN configurationTerminee TINYINT(1) DEFAULT 0;

-- Vérification
SELECT COUNT(*) as nb_colonnes_ajoutees FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('nomSociete','raisonSociale','telephone','telephone2','fixe','fax','ville','adresseComplete','ice','rc','if_','cnss','banque','codeBanque','compteBanque','activite','texte','logoBase64','signatureCachetBase64','devise','langue','configurationTerminee');
