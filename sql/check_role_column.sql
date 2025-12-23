-- Vérifier la structure de la table users
DESCRIBE users;

-- Vérifier spécifiquement la colonne role
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'knachsoft'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'role';

-- Vérifier les valeurs actuelles
SELECT id, username, role, ownerId FROM users ORDER BY id DESC LIMIT 10;
