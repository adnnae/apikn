-- Vérifier l'état actuel
SELECT id, username, role, ownerId FROM users WHERE role = 'admin';

-- Corriger tous les admins sans ownerId
UPDATE users SET ownerId = id WHERE role = 'admin' AND ownerId IS NULL;

-- Vérifier après correction
SELECT id, username, role, ownerId FROM users WHERE role = 'admin';
