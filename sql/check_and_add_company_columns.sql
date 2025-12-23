-- ============================================================================
-- SCRIPT SQL: Vérification et ajout des colonnes manquantes
-- ============================================================================
-- Ce script vérifie quelles colonnes existent déjà et n'ajoute que celles
-- qui sont manquantes. Vous pouvez l'exécuter plusieurs fois sans erreur.
-- ============================================================================

-- Étape 1: Vérifier quelles colonnes existent déjà
SELECT 
    'Colonnes existantes dans la table users:' AS info;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Étape 2: Vérifier quelles colonnes sont manquantes
SELECT 
    'Colonnes à ajouter (si elles n\'existent pas):' AS info;

SELECT col.column_name
FROM (
    SELECT 'nomSociete' AS column_name UNION ALL
    SELECT 'raisonSociale' UNION ALL
    SELECT 'telephone' UNION ALL
    SELECT 'telephone2' UNION ALL
    SELECT 'fixe' UNION ALL
    SELECT 'fax' UNION ALL
    SELECT 'ville' UNION ALL
    SELECT 'adresseComplete' UNION ALL
    SELECT 'ice' UNION ALL
    SELECT 'rc' UNION ALL
    SELECT 'if_' UNION ALL
    SELECT 'cnss' UNION ALL
    SELECT 'banque' UNION ALL
    SELECT 'codeBanque' UNION ALL
    SELECT 'compteBanque' UNION ALL
    SELECT 'activite' UNION ALL
    SELECT 'texte' UNION ALL
    SELECT 'logoBase64' UNION ALL
    SELECT 'signatureCachetBase64' UNION ALL
    SELECT 'devise' UNION ALL
    SELECT 'langue' UNION ALL
    SELECT 'configurationTerminee'
) AS col
WHERE col.column_name NOT IN (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
);

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
-- 1. Exécutez d'abord ce script pour voir quelles colonnes sont manquantes
-- 2. Ensuite, exécutez le script add_company_info_to_users_fixed.sql
--    en commentant les lignes ALTER TABLE pour les colonnes qui existent déjà
-- ============================================================================
