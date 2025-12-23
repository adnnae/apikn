-- ============================================
-- Corriger les ownerId NULL
-- ============================================
-- Tous les utilisateurs doivent avoir un ownerId

-- 1. Pour l'admin principal (id=1), définir ownerId = 1
UPDATE users SET ownerId = 1 WHERE id = 1 AND ownerId IS NULL;

-- 2. Pour tous les autres utilisateurs créés par admin (id=1), définir ownerId = 1
UPDATE users SET ownerId = 1 WHERE ownerId IS NULL AND id != 1;

-- 3. Vérification
SELECT id, username, role, ownerId 
FROM users 
ORDER BY ownerId, role DESC, id;

-- 4. Compter les utilisateurs par ownerId
SELECT 
  ownerId,
  COUNT(*) as total_users,
  SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
  SUM(CASE WHEN role = 'vendeur' THEN 1 ELSE 0 END) as vendeurs
FROM users
GROUP BY ownerId;
