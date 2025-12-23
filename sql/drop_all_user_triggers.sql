-- ============================================
-- Supprimer TOUS les triggers sur la table users
-- ============================================
-- Ces triggers interfèrent avec l'enregistrement du rôle

-- Voir d'abord les triggers existants
SELECT 
  TRIGGER_NAME,
  EVENT_MANIPULATION,
  ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE EVENT_OBJECT_SCHEMA = 'knachsoft'
  AND EVENT_OBJECT_TABLE = 'users';

-- Supprimer tous les triggers possibles
DROP TRIGGER IF EXISTS before_insert_users_shared;
DROP TRIGGER IF EXISTS after_insert_users_shared;
DROP TRIGGER IF EXISTS before_update_users_shared;
DROP TRIGGER IF EXISTS after_update_users_shared;
DROP TRIGGER IF EXISTS before_insert_users;
DROP TRIGGER IF EXISTS after_insert_users;
DROP TRIGGER IF EXISTS before_update_users;
DROP TRIGGER IF EXISTS after_update_users;

-- Vérifier qu'ils sont bien supprimés
SELECT 
  TRIGGER_NAME,
  EVENT_MANIPULATION,
  ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE EVENT_OBJECT_SCHEMA = 'knachsoft'
  AND EVENT_OBJECT_TABLE = 'users';

SELECT '✅ Triggers supprimés' AS message;
