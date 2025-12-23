-- ============================================
-- Corriger les rôles vides
-- ============================================

-- 1. Mettre à jour les utilisateurs sans rôle
-- Par défaut, on met 'user' pour les utilisateurs normaux
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- 2. Mettre 'admin' pour l'utilisateur principal (id=1)
UPDATE users SET role = 'admin' WHERE id = 1;

-- 3. Vérification
SELECT id, username, role, ownerId FROM users ORDER BY id;

-- 4. Compter par rôle
SELECT 
  role,
  COUNT(*) as total
FROM users
GROUP BY role;
