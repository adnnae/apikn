-- ============================================================================
-- SCRIPT SQL: Ajout des informations de société et logo à la table users
-- VERSION CORRIGÉE (compatible toutes versions MySQL)
-- ============================================================================
-- Date: 21 décembre 2024
-- Description: Ajoute toutes les colonnes nécessaires pour stocker les 
--              informations de société et les images (logo, cachet) pour 
--              chaque utilisateur dans la table users
-- ============================================================================

-- IMPORTANT: Sélectionnez votre base de données dans l'interface Adminer
-- ou décommentez la ligne suivante si vous exécutez via CLI:
-- USE default_db;

-- ============================================================================
-- AJOUT DES COLONNES D'INFORMATIONS DE SOCIÉTÉ
-- ============================================================================

-- Informations de base
ALTER TABLE users ADD COLUMN nomSociete VARCHAR(255) NULL COMMENT 'Nom de la société';
ALTER TABLE users ADD COLUMN raisonSociale VARCHAR(255) NULL COMMENT 'Raison sociale';
ALTER TABLE users ADD COLUMN telephone VARCHAR(50) NULL COMMENT 'Téléphone principal';
ALTER TABLE users ADD COLUMN telephone2 VARCHAR(50) NULL COMMENT 'Téléphone secondaire';
ALTER TABLE users ADD COLUMN fixe VARCHAR(50) NULL COMMENT 'Téléphone fixe';
ALTER TABLE users ADD COLUMN fax VARCHAR(50) NULL COMMENT 'Numéro de fax';

-- Adresse
ALTER TABLE users ADD COLUMN ville VARCHAR(100) NULL COMMENT 'Ville';
ALTER TABLE users ADD COLUMN adresseComplete TEXT NULL COMMENT 'Adresse complète';

-- Informations légales
ALTER TABLE users ADD COLUMN ice VARCHAR(50) NULL COMMENT 'Identifiant Commun de l\'Entreprise (ICE)';
ALTER TABLE users ADD COLUMN rc VARCHAR(50) NULL COMMENT 'Registre de Commerce (RC)';
ALTER TABLE users ADD COLUMN if_ VARCHAR(50) NULL COMMENT 'Identifiant Fiscal (IF)';
ALTER TABLE users ADD COLUMN cnss VARCHAR(50) NULL COMMENT 'Numéro CNSS';

-- Informations bancaires
ALTER TABLE users ADD COLUMN banque VARCHAR(100) NULL COMMENT 'Nom de la banque';
ALTER TABLE users ADD COLUMN codeBanque VARCHAR(50) NULL COMMENT 'Code de la banque';
ALTER TABLE users ADD COLUMN compteBanque VARCHAR(100) NULL COMMENT 'Numéro de compte bancaire';

-- Autres informations
ALTER TABLE users ADD COLUMN activite VARCHAR(255) NULL COMMENT 'Activité de l\'entreprise';
ALTER TABLE users ADD COLUMN texte TEXT NULL COMMENT 'Texte personnalisé (pied de page, mentions légales, etc.)';

-- ============================================================================
-- AJOUT DES COLONNES POUR LES IMAGES (LOGO ET CACHET)
-- ============================================================================

-- Logo de l'entreprise (stocké en base64)
ALTER TABLE users ADD COLUMN logoBase64 LONGTEXT NULL COMMENT 'Logo de l\'entreprise encodé en base64';

-- Cachet/Signature (stocké en base64)
ALTER TABLE users ADD COLUMN signatureCachetBase64 LONGTEXT NULL COMMENT 'Image du cachet ou signature encodée en base64';

-- ============================================================================
-- AJOUT DES COLONNES DE CONFIGURATION
-- ============================================================================

-- Devise préférée
ALTER TABLE users ADD COLUMN devise VARCHAR(10) DEFAULT 'MAD' COMMENT 'Code de la devise (EUR, USD, MAD, etc.)';

-- Langue préférée
ALTER TABLE users ADD COLUMN langue VARCHAR(10) DEFAULT 'fr' COMMENT 'Code de la langue (fr, en, ar, etc.)';

-- Configuration terminée
ALTER TABLE users ADD COLUMN configurationTerminee TINYINT(1) DEFAULT 0 COMMENT 'Indique si la configuration initiale est terminée';

-- ============================================================================
-- VÉRIFICATION DES COLONNES AJOUTÉES
-- ============================================================================

SELECT '✅ Colonnes ajoutées avec succès!' AS status;

-- Afficher toutes les colonnes de la table users
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
