require('dotenv').config();
const { pool } = require('./db');

async function checkDates() {
  try {
    const [rows] = await pool.query('SELECT id, venteId, dateRetour, montantTotal FROM retours_ventes ORDER BY dateRetour DESC');
    
    console.log('\n📅 Dates des retours de vente dans MySQL:\n');
    rows.forEach(r => {
      const date = new Date(r.dateRetour);
      console.log(`  ID: ${r.id}`);
      console.log(`    Vente: ${r.venteId}`);
      console.log(`    Date UTC: ${date.toISOString()}`);
      console.log(`    Date locale: ${date.toLocaleString('fr-FR')}`);
      console.log(`    Jour: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`);
      console.log(`    Montant: ${r.montantTotal}`);
      console.log('');
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📆 Aujourd'hui (00:00): ${today.toLocaleString('fr-FR')}`);
    console.log(`📆 Aujourd'hui (jour): ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`);
    
    await pool.end();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkDates();
