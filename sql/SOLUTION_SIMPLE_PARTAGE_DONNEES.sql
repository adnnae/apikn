-- ============================================
-- SOLUTION SIMPLE : Partage de données sans modifier les routes
-- ============================================
-- Au lieu de modifier toutes les routes pour utiliser ownerId,
-- on va simplement mettre à jour le userId dans TOUTES les tables
-- pour que le vendeur ait le même userId que l'admin

-- ÉTAPE 1: Identifier l'admin et le vendeur
-- Exemple: admin (id=1), vendeur (id=55)
SET @adminId = 1;
SET @vendeurId = 55;

-- ÉTAPE 2: Mettre à jour TOUTES les données du vendeur pour utiliser l'id de l'admin
-- Cela permet au vendeur de voir les mêmes données que l'admin

-- Produits
UPDATE produits SET userId = @adminId WHERE userId = @vendeurId;

-- Clients
UPDATE clients SET userId = @adminId WHERE userId = @vendeurId;

-- Fournisseurs
UPDATE fournisseurs SET userId = @adminId WHERE userId = @vendeurId;

-- Ventes
UPDATE ventes SET userId = @adminId WHERE userId = @vendeurId;

-- Achats
UPDATE achats SET userId = @adminId WHERE userId = @vendeurId;

-- Lignes de vente
UPDATE lignes_vente SET userId = @adminId WHERE userId = @vendeurId;

-- Lignes d'achat
UPDATE lignes_achat SET userId = @adminId WHERE userId = @vendeurId;

-- Devis
UPDATE devis SET userId = @adminId WHERE userId = @vendeurId;

-- Factures
UPDATE factures SET userId = @adminId WHERE userId = @vendeurId;

-- Règlements clients
UPDATE reglements_clients SET userId = @adminId WHERE userId = @vendeurId;

-- Règlements fournisseurs
UPDATE reglements_fournisseurs SET userId = @adminId WHERE userId = @vendeurId;

-- Dépenses
UPDATE depenses SET userId = @adminId WHERE userId = @vendeurId;

-- Catégories
UPDATE categories SET userId = @adminId WHERE userId = @vendeurId;

-- Retours vente
UPDATE retours_vente SET userId = @adminId WHERE userId = @vendeurId;

-- Retours achat
UPDATE retours_achat SET userId = @adminId WHERE userId = @vendeurId;

-- Lignes retours vente
UPDATE lignes_retours_vente SET userId = @adminId WHERE userId = @vendeurId;

-- Lignes retours achat
UPDATE lignes_retours_achat SET userId = @adminId WHERE userId = @vendeurId;

-- ÉTAPE 3: Créer un TRIGGER pour automatiser cela à l'avenir
-- Quand un vendeur crée une donnée, elle sera automatiquement assignée à l'admin

DELIMITER $$

-- Trigger pour les ventes
DROP TRIGGER IF EXISTS before_insert_ventes_shared$$
CREATE TRIGGER before_insert_ventes_shared
BEFORE INSERT ON ventes
FOR EACH ROW
BEGIN
  DECLARE owner_id INT;
  -- Récupérer l'ownerId de l'utilisateur qui crée
  SELECT ownerId INTO owner_id FROM users WHERE id = NEW.userId LIMIT 1;
  -- Si l'utilisateur a un ownerId, utiliser celui-ci
  IF owner_id IS NOT NULL THEN
    SET NEW.userId = owner_id;
  END IF;
END$$

-- Trigger pour les achats
DROP TRIGGER IF EXISTS before_insert_achats_shared$$
CREATE TRIGGER before_insert_achats_shared
BEFORE INSERT ON achats
FOR EACH ROW
BEGIN
  DECLARE owner_id INT;
  SELECT ownerId INTO owner_id FROM users WHERE id = NEW.userId LIMIT 1;
  IF owner_id IS NOT NULL THEN
    SET NEW.userId = owner_id;
  END IF;
END$$

-- Trigger pour les clients
DROP TRIGGER IF EXISTS before_insert_clients_shared$$
CREATE TRIGGER before_insert_clients_shared
BEFORE INSERT ON clients
FOR EACH ROW
BEGIN
  DECLARE owner_id INT;
  SELECT ownerId INTO owner_id FROM users WHERE id = NEW.userId LIMIT 1;
  IF owner_id IS NOT NULL THEN
    SET NEW.userId = owner_id;
  END IF;
END$$

-- Trigger pour les produits
DROP TRIGGER IF EXISTS before_insert_produits_shared$$
CREATE TRIGGER before_insert_produits_shared
BEFORE INSERT ON produits
FOR EACH ROW
BEGIN
  DECLARE owner_id INT;
  SELECT ownerId INTO owner_id FROM users WHERE id = NEW.userId LIMIT 1;
  IF owner_id IS NOT NULL THEN
    SET NEW.userId = owner_id;
  END IF;
END$$

DELIMITER ;

-- ÉTAPE 4: Vérification
SELECT 'Vérification des données partagées' AS status;

SELECT 'Produits' AS table_name, COUNT(*) AS count FROM produits WHERE userId = @adminId
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients WHERE userId = @adminId
UNION ALL
SELECT 'Ventes', COUNT(*) FROM ventes WHERE userId = @adminId
UNION ALL
SELECT 'Achats', COUNT(*) FROM achats WHERE userId = @adminId;

SELECT '✅ Configuration terminée!' AS message;
SELECT 'Les données sont maintenant partagées entre admin et vendeur' AS info;
SELECT 'Les nouveaux enregistrements créés par le vendeur seront automatiquement assignés à l\'admin' AS info2;
