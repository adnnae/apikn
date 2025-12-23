-- ============================================
-- SOLUTION ULTIME : Vues MySQL pour partage automatique
-- ============================================
-- Cette solution crée des vues qui remplacent les tables
-- Les vues filtrent automatiquement par ownerId au lieu de userId
-- AUCUNE modification des routes API nécessaire !

-- 1. Renommer les tables originales (backup)
RENAME TABLE ventes TO ventes_original;
RENAME TABLE achats TO achats_original;
RENAME TABLE clients TO clients_original;
RENAME TABLE fournisseurs TO fournisseurs_original;
RENAME TABLE produits TO produits_original;
RENAME TABLE lignes_vente TO lignes_vente_original;
RENAME TABLE lignes_achat TO lignes_achat_original;
RENAME TABLE depenses TO depenses_original;
RENAME TABLE categories TO categories_original;

-- 2. Créer des vues qui filtrent par ownerId
-- Vue pour ventes
CREATE VIEW ventes AS
SELECT v.* 
FROM ventes_original v
INNER JOIN users u ON v.userId = u.ownerId OR v.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour achats
CREATE VIEW achats AS
SELECT a.* 
FROM achats_original a
INNER JOIN users u ON a.userId = u.ownerId OR a.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour clients
CREATE VIEW clients AS
SELECT c.* 
FROM clients_original c
INNER JOIN users u ON c.userId = u.ownerId OR c.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour fournisseurs
CREATE VIEW fournisseurs AS
SELECT f.* 
FROM fournisseurs_original f
INNER JOIN users u ON f.userId = u.ownerId OR f.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour produits
CREATE VIEW produits AS
SELECT p.* 
FROM produits_original p
INNER JOIN users u ON p.userId = u.ownerId OR p.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour lignes_vente
CREATE VIEW lignes_vente AS
SELECT lv.* 
FROM lignes_vente_original lv
INNER JOIN users u ON lv.userId = u.ownerId OR lv.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour lignes_achat
CREATE VIEW lignes_achat AS
SELECT la.* 
FROM lignes_achat_original la
INNER JOIN users u ON la.userId = u.ownerId OR la.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour depenses
CREATE VIEW depenses AS
SELECT d.* 
FROM depenses_original d
INNER JOIN users u ON d.userId = u.ownerId OR d.userId = u.id
WHERE u.id = (SELECT @current_user_id);

-- Vue pour categories
CREATE VIEW categories AS
SELECT c.* 
FROM categories_original c
INNER JOIN users u ON c.userId = u.ownerId OR c.userId = u.id
WHERE u.id = (SELECT @current_user_id);

SELECT '✅ Vues créées avec succès!' AS message;
SELECT 'Les données sont maintenant partagées automatiquement' AS info;
