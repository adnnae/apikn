require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // ✅ Timeout de connexion (option valide pour mysql2)
  connectTimeout: 60000,      // 60 secondes pour se connecter
  
  // ✅ Gestion des connexions inactives (options valides)
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ✅ Handlers pour gestion des erreurs de connexion
pool.on('connection', function (connection) {
  console.log('✅ Nouvelle connexion MySQL établie');
  
  connection.on('error', function(err) {
    console.error('❌ Erreur MySQL:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔄 Reconnexion MySQL...');
    }
  });
});

pool.on('error', function(err) {
  console.error('❌ Erreur pool MySQL:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Pool MySQL reconnecté');
  }
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = {
  pool,
  testConnection,
};
