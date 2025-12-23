// Script pour créer les tables retours dans MySQL
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTables() {
  let connection;
  
  try {
    console.log('🔄 Connexion à MySQL...');
    console.log(`   Serveur: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   Base de données: ${process.env.DB_NAME}`);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connecté à MySQL\n');

    // Table retours_ventes
    console.log('📝 Création de la table retours_ventes...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS retours_ventes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL DEFAULT 1,
        marchandiseId INT NOT NULL,
        venteId INT NOT NULL,
        clientId INT,
        dateRetour DATETIME NOT NULL,
        montantTotal DECIMAL(10,2) NOT NULL,
        statut VARCHAR(50) DEFAULT 'valide',
        raison TEXT,
        notes TEXT,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_userId (userId),
        INDEX idx_venteId (venteId),
        INDEX idx_marchandiseId (marchandiseId),
        INDEX idx_dateRetour (dateRetour)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table retours_ventes créée\n');

    // Table retours_achats
    console.log('📝 Création de la table retours_achats...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS retours_achats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL DEFAULT 1,
        marchandiseId INT NOT NULL,
        achatId INT NOT NULL,
        fournisseurId INT,
        dateRetour DATETIME NOT NULL,
        montantTotal DECIMAL(10,2) NOT NULL,
        statut VARCHAR(50) DEFAULT 'valide',
        raison TEXT,
        notes TEXT,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_userId (userId),
        INDEX idx_achatId (achatId),
        INDEX idx_marchandiseId (marchandiseId),
        INDEX idx_dateRetour (dateRetour)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table retours_achats créée\n');

    // Table lignes_retour_vente
    console.log('📝 Création de la table lignes_retour_vente...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lignes_retour_vente (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL DEFAULT 1,
        retourVenteId INT NOT NULL,
        produitId INT NOT NULL,
        quantite INT NOT NULL,
        prixUnitaire DECIMAL(10,2) NOT NULL,
        montantLigne DECIMAL(10,2) NOT NULL,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_userId (userId),
        INDEX idx_retourVente (retourVenteId),
        INDEX idx_produit (produitId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table lignes_retour_vente créée\n');

    // Table lignes_retour_achat
    console.log('📝 Création de la table lignes_retour_achat...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lignes_retour_achat (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL DEFAULT 1,
        retourAchatId INT NOT NULL,
        produitId INT NOT NULL,
        quantite INT NOT NULL,
        prixUnitaire DECIMAL(10,2) NOT NULL,
        montantLigne DECIMAL(10,2) NOT NULL,
        deviceId VARCHAR(100),
        lastModified DATETIME,
        INDEX idx_userId (userId),
        INDEX idx_retourAchat (retourAchatId),
        INDEX idx_produit (produitId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table lignes_retour_achat créée\n');

    console.log('🎉 Toutes les tables ont été créées avec succès !');
    console.log('\n📋 Tables créées :');
    console.log('   - retours_ventes');
    console.log('   - retours_achats');
    console.log('   - lignes_retour_vente');
    console.log('   - lignes_retour_achat');
    console.log('\n✅ Vous pouvez maintenant tester l\'API :');
    console.log('   curl http://localhost:4000/api/retours_ventes');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion MySQL fermée');
    }
  }
}

createTables();
