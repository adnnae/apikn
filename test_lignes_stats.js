const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLignesStats() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'knachsoft',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    console.log('🔍 Test des données pour statistiques...\n');

    // Test ventes
    const [ventes] = await pool.query('SELECT * FROM ventes ORDER BY id DESC LIMIT 5');
    console.log(`✅ Ventes: ${ventes.length} enregistrements`);
    if (ventes.length > 0) {
      console.log('   Exemple:', {
        id: ventes[0].id,
        clientId: ventes[0].clientId,
        montantTotal: ventes[0].montantTotal,
        dateVente: ventes[0].dateVente
      });
    }

    // Test lignes_vente
    const [lignesVente] = await pool.query('SELECT * FROM lignes_vente ORDER BY id DESC LIMIT 5');
    console.log(`\n✅ Lignes vente: ${lignesVente.length} enregistrements`);
    if (lignesVente.length > 0) {
      console.log('   Exemple:', {
        id: lignesVente[0].id,
        venteId: lignesVente[0].venteId,
        produitId: lignesVente[0].produitId,
        quantite: lignesVente[0].quantite,
        montantLigne: lignesVente[0].montantLigne
      });
    }

    // Test achats
    const [achats] = await pool.query('SELECT * FROM achats ORDER BY id DESC LIMIT 5');
    console.log(`\n✅ Achats: ${achats.length} enregistrements`);
    if (achats.length > 0) {
      console.log('   Exemple:', {
        id: achats[0].id,
        fournisseurId: achats[0].fournisseurId,
        montantTotal: achats[0].montantTotal,
        dateAchat: achats[0].dateAchat
      });
    }

    // Test lignes_achat
    const [lignesAchat] = await pool.query('SELECT * FROM lignes_achat ORDER BY id DESC LIMIT 5');
    console.log(`\n✅ Lignes achat: ${lignesAchat.length} enregistrements`);
    if (lignesAchat.length > 0) {
      console.log('   Exemple:', {
        id: lignesAchat[0].id,
        achatId: lignesAchat[0].achatId,
        produitId: lignesAchat[0].produitId,
        quantite: lignesAchat[0].quantite,
        montantLigne: lignesAchat[0].montantLigne
      });
    }

    // Test relation ventes -> lignes_vente
    if (ventes.length > 0) {
      const venteId = ventes[0].id;
      const [lignesForVente] = await pool.query(
        'SELECT * FROM lignes_vente WHERE venteId = ?',
        [venteId]
      );
      console.log(`\n🔗 Lignes pour vente #${venteId}: ${lignesForVente.length} lignes`);
      if (lignesForVente.length === 0) {
        console.log('   ⚠️ PROBLÈME: Aucune ligne trouvée pour cette vente!');
      }
    }

    // Test relation achats -> lignes_achat
    if (achats.length > 0) {
      const achatId = achats[0].id;
      const [lignesForAchat] = await pool.query(
        'SELECT * FROM lignes_achat WHERE achatId = ?',
        [achatId]
      );
      console.log(`\n🔗 Lignes pour achat #${achatId}: ${lignesForAchat.length} lignes`);
      if (lignesForAchat.length === 0) {
        console.log('   ⚠️ PROBLÈME: Aucune ligne trouvée pour cet achat!');
      }
    }

    console.log('\n✅ Test terminé!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

testLignesStats();
