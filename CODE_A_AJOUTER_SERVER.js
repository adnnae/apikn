// ==========================================
// CODE À AJOUTER DANS server.js
// ==========================================
// 
// Ajouter ces lignes AVANT app.listen(PORT, ...)
// Chercher la ligne: app.listen(PORT, () => {
// Et ajouter JUSTE AVANT:

// ==================== REGLEMENTS CLIENTS ====================
const reglementsClientsRouter = require('./routes/reglements_clients');
app.use('/api/reglements_clients', reglementsClientsRouter);

// ==================== REGLEMENTS FOURNISSEURS ====================
const reglementsFournisseursRouter = require('./routes/reglements_fournisseurs');
app.use('/api/reglements_fournisseurs', reglementsFournisseursRouter);

// ==========================================
// FIN DU CODE À AJOUTER
// ==========================================
