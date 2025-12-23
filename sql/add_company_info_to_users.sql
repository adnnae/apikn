-- ============================================================================
-- SCRIPT SQL: Ajout des informations de société et logo à la table users
-- ============================================================================
-- Date: 21 décembre 2024
-- Description: Ajoute toutes les colonnes nécessaires pour stocker les 
--              informations de société et les images (logo, cachet) pour 
--              chaque utilisateur dans la table users
-- ============================================================================

USE knachsof_gestion;

-- Vérifier que la table users existe
SELECT 'Vérification de la table users...' AS status;
SHOW TABLES LIKE 'users';

-- ============================================================================
-- AJOUT DES COLONNES D'INFORMATIONS DE SOCIÉTÉ
-- ============================================================================

-- Informations de base
ALTER TABLE users ADD COLUMN IF NOT EXISTS nomSociete VARCHAR(255) NULL COMMENT 'Nom de la société';
ALTER TABLE users ADD COLUMN IF NOT EXISTS raisonSociale VARCHAR(255) NULL COMMENT 'Raison sociale';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL COMMENT 'Email de la société';
ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone VARCHAR(50) NULL COMMENT 'Téléphone principal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone2 VARCHAR(50) NULL COMMENT 'Téléphone secondaire';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fixe VARCHAR(50) NULL COMMENT 'Téléphone fixe';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fax VARCHAR(50) NULL COMMENT 'Numéro de fax';

-- Adresse
ALTER TABLE users ADD COLUMN IF NOT EXISTS ville VARCHAR(100) NULL COMMENT 'Ville';
ALTER TABLE users ADD COLUMN IF NOT EXISTS adresseComplete TEXT NULL COMMENT 'Adresse complète';

-- Informations légales
ALTER TABLE users ADD COLUMN IF NOT EXISTS ice VARCHAR(50) NULL COMMENT 'Identifiant Commun de l\'Entreprise (ICE)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rc VARCHAR(50) NULL COMMENT 'Registre de Commerce (RC)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS if_ VARCHAR(50) NULL COMMENT 'Identifiant Fiscal (IF)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnss VARCHAR(50) NULL COMMENT 'Numéro CNSS';

-- Informations bancaires
ALTER TABLE users ADD COLUMN IF NOT EXISTS banque VARCHAR(100) NULL COMMENT 'Nom de la banque';
ALTER TABLE users ADD COLUMN IF NOT EXISTS codeBanque VARCHAR(50) NULL COMMENT 'Code de la banque';
ALTER TABLE users ADD COLUMN IF NOT EXISTS compteBanque VARCHAR(100) NULL COMMENT 'Numéro de compte bancaire';

-- Autres informations
ALTER TABLE users ADD COLUMN IF NOT EXISTS activite VARCHAR(255) NULL COMMENT 'Activité de l\'entreprise';
ALTER TABLE users ADD COLUMN IF NOT EXISTS texte TEXT NULL COMMENT 'Texte personnalisé (pied de page, mentions légales, etc.)';

-- ============================================================================
-- AJOUT DES COLONNES POUR LES IMAGES (LOGO ET CACHET)
-- ============================================================================

-- Logo de l'entreprise (stocké en base64)
ALTER TABLE users ADD COLUMN IF NOT EXISTS logoBase64 LONGTEXT NULL COMMENT 'Logo de l\'entreprise encodé en base64';

-- Cachet/Signature (stocké en base64)
ALTER TABLE users ADD COLUMN IF NOT EXISTS signatureCachetBase64 LONGTEXT NULL COMMENT 'Image du cachet ou signature encodée en base64';

-- ============================================================================
-- AJOUT DES COLONNES DE CONFIGURATION
-- ============================================================================

-- Devise préférée
ALTER TABLE users ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'MAD' COMMENT 'Code de la devise (EUR, USD, MAD, etc.)';

-- Langue préférée
ALTER TABLE users ADD COLUMN IF NOT EXISTS langue VARCHAR(10) DEFAULT 'fr' COMMENT 'Code de la langue (fr, en, ar, etc.)';

-- Configuration terminée
ALTER TABLE users ADD COLUMN IF NOT EXISTS configurationTerminee BOOLEAN DEFAULT FALSE COMMENT 'Indique si la configuration initiale est terminée';

-- ============================================================================
-- VÉRIFICATION DES COLONNES AJOUTÉES
-- ============================================================================

SELECT 'Vérification des colonnes ajoutées...' AS status;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'knachsof_gestion'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN (
    'nomSociete', 'raisonSociale', 'email', 'telephone', 'telephone2', 
    'fixe', 'fax', 'ville', 'adresseComplete', 'ice', 'rc', 'if_', 
    'cnss', 'banque', 'codeBanque', 'compteBanque', 'activite', 'texte',
    'logoBase64', 'signatureCachetBase64', 'devise', 'langue', 'configurationTerminee'
  )
ORDER BY COLUMN_NAME;

-- ============================================================================
-- EXEMPLE D'UTILISATION: Mise à jour des informations pour l'utilisateur admin
-- ============================================================================

-- Décommenter et adapter les lignes suivantes pour mettre à jour l'utilisateur admin:

/*
UPDATE users 
SET 
    nomSociete = 'Ma Société',
    raisonSociale = 'Ma Société SARL',
    email = 'contact@masociete.com',
    telephone = '0612345678',
    fixe = '0522123456',
    ville = 'Casablanca',
    adresseComplete = '123 Rue Example, Casablanca, Maroc',
    ice = '000123456789012',
    rc = 'RC123456',
    if_ = 'IF123456',
    activite = 'Commerce général',
    devise = 'MAD',
    langue = 'fr',
    configurationTerminee = TRUE
WHERE id = 1; -- ID de l'utilisateur admin
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

/*
1. STOCKAGE DES IMAGES:
   - Les colonnes logoBase64 et signatureCachetBase64 utilisent le type LONGTEXT
   - Elles peuvent stocker des images jusqu'à 4GB (en pratique, limitez à quelques MB)
   - Les images sont encodées en base64 avant d'être stockées
   - Format recommandé: JPEG ou PNG, taille max 800x800px, qualité 85%

2. COLONNES NULLABLE:
   - Toutes les colonnes sont NULL par défaut
   - Cela permet une configuration progressive
   - L'utilisateur peut remplir les informations au fur et à mesure

3. DEVISE ET LANGUE:
   - devise: Code ISO 4217 (EUR, USD, MAD, etc.)
   - langue: Code ISO 639-1 (fr, en, ar, etc.)
   - Valeurs par défaut: MAD et fr

4. SÉCURITÉ:
   - Les informations sensibles (RC, IF, CNSS, compte bancaire) sont stockées en clair
   - Considérez le chiffrement si nécessaire
   - Limitez l'accès à ces colonnes via les permissions MySQL

5. PERFORMANCE:
   - Les colonnes LONGTEXT (images) peuvent ralentir les requêtes
   - Évitez de sélectionner logoBase64 et signatureCachetBase64 dans les requêtes fréquentes
   - Utilisez SELECT nomSociete, email, ... au lieu de SELECT *

6. MIGRATION DES DONNÉES:
   - Si vous aviez une table Settings séparée, migrez les données vers users
   - Chaque utilisateur aura ses propres paramètres de société
*/

-- ============================================================================
-- SCRIPT DE MIGRATION (si vous aviez une table Settings)
-- ============================================================================

/*
-- Décommenter si vous voulez migrer depuis une table Settings existante:

UPDATE users u
LEFT JOIN Settings s ON s.userId = u.id
SET 
    u.nomSociete = s.nomSociete,
    u.raisonSociale = s.raisonSociale,
    u.email = s.email,
    u.telephone = s.telephone,
    u.telephone2 = s.telephone2,
    u.fixe = s.fixe,
    u.fax = s.fax,
    u.ville = s.ville,
    u.adresseComplete = s.adresseComplete,
    u.ice = s.ice,
    u.rc = s.rc,
    u.if_ = s.if_,
    u.cnss = s.cnss,
    u.banque = s.banque,
    u.codeBanque = s.codeBanque,
    u.compteBanque = s.compteBanque,
    u.activite = s.activite,
    u.texte = s.texte,
    u.logoBase64 = s.logoBase64,
    u.signatureCachetBase64 = s.signatureCachetBase64,
    u.devise = s.devise,
    u.langue = s.langue,
    u.configurationTerminee = s.configurationTerminee
WHERE s.id IS NOT NULL;
*/

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

SELECT '✅ Script exécuté avec succès!' AS status;
SELECT 'Les colonnes ont été ajoutées à la table users.' AS message;
SELECT 'Vous pouvez maintenant stocker les informations de société pour chaque utilisateur.' AS info;
