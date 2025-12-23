/**
 * Script pour corriger les requêtes INSERT et UPDATE
 * - Retirer userId de req.body destructuring dans PUT
 * - Ajouter userId dans INSERT où manquant
 * - Ajouter AND userId = ? dans UPDATE WHERE clauses
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Correction des INSERT et UPDATE pour userId...\n');

// Lire le fichier server.js
let content = fs.readFileSync(serverPath, 'utf8');

// Créer une sauvegarde
const backupPath = path.join(__dirname, 'server.js.before_insert_update_fix');
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Sauvegarde créée: ${backupPath}\n`);

let modificationsCount = 0;

// ============================================================================
// 1. CORRIGER PUT /api/produits/:id - Retirer userId de req.body
// ============================================================================
console.log('📝 Correction PUT /api/produits/:id...');

const putProduitsOld = `app.put('/api/produits/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId,
      userId,
      nom,`;

const putProduitsNew = `app.put('/api/produits/:id', authMiddleware, async (req, res) => {
  const userId = req.userId; // ✅ Extrait du JWT
  try {
    const {
      marchandiseId,
      nom,`;

if (content.includes(putProduitsOld)) {
  content = content.replace(putProduitsOld, putProduitsNew);
  console.log(`  ✅ PUT /api/produits/:id - userId retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 2. CORRIGER POST /api/produits - Retirer userId = 1 de req.body
// ============================================================================
console.log('\n📝 Correction POST /api/produits...');

const postProduitsOld = `const {
      nom,
      reference,
      prixAchat,
      prixVente,
      quantite = 0,
      marchandiseId = 1,
      userId = 1,
      categorieId,`;

const postProduitsNew = `const {
      nom,
      reference,
      prixAchat,
      prixVente,
      quantite = 0,
      marchandiseId = 1,
      categorieId,`;

if (content.includes(postProduitsOld)) {
  content = content.replace(postProduitsOld, postProduitsNew);
  console.log(`  ✅ POST /api/produits - userId = 1 retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 3. CORRIGER POST /api/ventes - Ajouter userId dans INSERT
// ============================================================================
console.log('\n📝 Correction POST /api/ventes...');

const postVentesInsertOld = `const [result] = await pool.query(
      \`INSERT INTO ventes
       (marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );`;

const postVentesInsertNew = `const [result] = await pool.query(
      \`INSERT INTO ventes
       (userId, marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [userId, marchandiseId, clientId, numeroFacture, dateVente, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );`;

if (content.includes(postVentesInsertOld)) {
  content = content.replace(postVentesInsertOld, postVentesInsertNew);
  console.log(`  ✅ POST /api/ventes - userId ajouté dans INSERT`);
  modificationsCount++;
}

// ============================================================================
// 4. CORRIGER PUT /api/ventes/:id - Ajouter AND userId = ?
// ============================================================================
console.log('\n📝 Correction PUT /api/ventes/:id...');

const putVentesUpdateOld = `const [result] = await pool.query(
      \`UPDATE ventes SET
         clientId = COALESCE(?, clientId),
         numeroFacture = COALESCE(?, numeroFacture),
         dateVente = COALESCE(?, dateVente),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ?\`,
      [
        clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id,
      ],
    );`;

const putVentesUpdateNew = `const [result] = await pool.query(
      \`UPDATE ventes SET
         clientId = COALESCE(?, clientId),
         numeroFacture = COALESCE(?, numeroFacture),
         dateVente = COALESCE(?, dateVente),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ? AND userId = ?\`,
      [
        clientId, numeroFacture, dateVente, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ],
    );`;

if (content.includes(putVentesUpdateOld)) {
  content = content.replace(putVentesUpdateOld, putVentesUpdateNew);
  console.log(`  ✅ PUT /api/ventes/:id - AND userId = ? ajouté`);
  modificationsCount++;
}

// ============================================================================
// 5. CORRIGER POST /api/achats - Ajouter userId dans INSERT
// ============================================================================
console.log('\n📝 Correction POST /api/achats...');

const postAchatsInsertOld = `const [result] = await pool.query(
      \`INSERT INTO achats
       (marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );`;

const postAchatsInsertNew = `const [result] = await pool.query(
      \`INSERT INTO achats
       (userId, marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [userId, marchandiseId, fournisseurId, dateAchat, montantTotal, montantPaye,
       statut, notes, deviceId, new Date()],
    );`;

if (content.includes(postAchatsInsertOld)) {
  content = content.replace(postAchatsInsertOld, postAchatsInsertNew);
  console.log(`  ✅ POST /api/achats - userId ajouté dans INSERT`);
  modificationsCount++;
}

// ============================================================================
// 6. CORRIGER PUT /api/achats/:id - Ajouter AND userId = ?
// ============================================================================
console.log('\n📝 Correction PUT /api/achats/:id...');

const putAchatsUpdateOld = `const [result] = await pool.query(
      \`UPDATE achats SET
         fournisseurId = COALESCE(?, fournisseurId),
         dateAchat = COALESCE(?, dateAchat),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ?\`,
      [
        fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id,
      ],
    );`;

const putAchatsUpdateNew = `const [result] = await pool.query(
      \`UPDATE achats SET
         fournisseurId = COALESCE(?, fournisseurId),
         dateAchat = COALESCE(?, dateAchat),
         montantTotal = COALESCE(?, montantTotal),
         montantPaye = COALESCE(?, montantPaye),
         statut = COALESCE(?, statut),
         notes = COALESCE(?, notes),
         lastModified = ?
       WHERE id = ? AND userId = ?\`,
      [
        fournisseurId, dateAchat, montantTotal, montantPaye,
        statut, notes, new Date(), req.params.id, userId,
      ],
    );`;

if (content.includes(putAchatsUpdateOld)) {
  content = content.replace(putAchatsUpdateOld, putAchatsUpdateNew);
  console.log(`  ✅ PUT /api/achats/:id - AND userId = ? ajouté`);
  modificationsCount++;
}

// ============================================================================
// 7. CORRIGER POST /api/depenses - Ajouter userId dans INSERT
// ============================================================================
console.log('\n📝 Correction POST /api/depenses...');

const postDepensesInsertOld = `const [result] = await pool.query(
      \`INSERT INTO depenses
       (marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, now, now, deviceId, now,
      ],
    );`;

const postDepensesInsertNew = `const [result] = await pool.query(
      \`INSERT INTO depenses
       (userId, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, dateCreation, dateModification, deviceId, lastModified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        userId, marchandiseId, libelle, montant, dateDepense, description,
        categorie, modePaiement, now, now, deviceId, now,
      ],
    );`;

if (content.includes(postDepensesInsertOld)) {
  content = content.replace(postDepensesInsertOld, postDepensesInsertNew);
  console.log(`  ✅ POST /api/depenses - userId ajouté dans INSERT`);
  modificationsCount++;
}

// ============================================================================
// 8. CORRIGER POST /api/clients - Ajouter userId dans INSERT
// ============================================================================
console.log('\n📝 Correction POST /api/clients...');

const postClientsInsertOld = `const [result] = await pool.query(
      \`INSERT INTO clients
       (marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        marchandiseId,
        nom,
        prenom,
        entreprise,
        email,
        telephone,
        adresse,
        solde,
        ice,
        rc,
        now,
      ],
    );`;

const postClientsInsertNew = `const [result] = await pool.query(
      \`INSERT INTO clients
       (userId, marchandiseId, nom, prenom, entreprise, email, telephone,
        adresse, solde, ice, rc, dateCreation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        userId,
        marchandiseId,
        nom,
        prenom,
        entreprise,
        email,
        telephone,
        adresse,
        solde,
        ice,
        rc,
        now,
      ],
    );`;

if (content.includes(postClientsInsertOld)) {
  content = content.replace(postClientsInsertOld, postClientsInsertNew);
  console.log(`  ✅ POST /api/clients - userId ajouté dans INSERT`);
  modificationsCount++;
}

// ============================================================================
// 9. CORRIGER POST /api/fournisseurs - Ajouter userId dans INSERT
// ============================================================================
console.log('\n📝 Correction POST /api/fournisseurs...');

const postFournisseursInsertOld = `const [result] = await pool.query(
      \`INSERT INTO fournisseurs
       (marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        marchandiseId,
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        now,
        now,
      ],
    );`;

const postFournisseursInsertNew = `const [result] = await pool.query(
      \`INSERT INTO fournisseurs
       (userId, marchandiseId, nom, tele, adress, solde, ice, rc,
        dateCreation, dateModification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        userId,
        marchandiseId,
        nom,
        tele,
        adress,
        solde,
        ice,
        rc,
        now,
        now,
      ],
    );`;

if (content.includes(postFournisseursInsertOld)) {
  content = content.replace(postFournisseursInsertOld, postFournisseursInsertNew);
  console.log(`  ✅ POST /api/fournisseurs - userId ajouté dans INSERT`);
  modificationsCount++;
}

// ============================================================================
// 10. CORRIGER POST /api/lignes_vente - Retirer userId = 1 de req.body
// ============================================================================
console.log('\n📝 Correction POST /api/lignes_vente...');

const postLignesVenteOld = `const {
      venteId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
      userId = 1,
    } = req.body;`;

const postLignesVenteNew = `const {
      venteId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
    } = req.body;`;

if (content.includes(postLignesVenteOld)) {
  content = content.replace(postLignesVenteOld, postLignesVenteNew);
  console.log(`  ✅ POST /api/lignes_vente - userId = 1 retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 11. CORRIGER POST /api/lignes_achat - Retirer userId = 1 de req.body
// ============================================================================
console.log('\n📝 Correction POST /api/lignes_achat...');

const postLignesAchatOld = `const {
      achatId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
      userId = 1,
    } = req.body;`;

const postLignesAchatNew = `const {
      achatId,
      produitId,
      quantite,
      prixUnitaire,
      montantLigne,
    } = req.body;`;

if (content.includes(postLignesAchatOld)) {
  content = content.replace(postLignesAchatOld, postLignesAchatNew);
  console.log(`  ✅ POST /api/lignes_achat - userId = 1 retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 12. CORRIGER POST /api/retours_ventes - Retirer userId = 1 de req.body
// ============================================================================
console.log('\n📝 Correction POST /api/retours_ventes...');

const postRetoursVentesOld = `const {
      id,
      userId = 1,
      marchandiseId,`;

const postRetoursVentesNew = `const {
      id,
      marchandiseId,`;

if (content.includes(postRetoursVentesOld)) {
  content = content.replace(postRetoursVentesOld, postRetoursVentesNew);
  console.log(`  ✅ POST /api/retours_ventes - userId = 1 retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 13. CORRIGER PUT /api/retours_ventes/:id - Retirer userId de req.body
// ============================================================================
console.log('\n📝 Correction PUT /api/retours_ventes/:id...');

const putRetoursVentesOld = `const {
      userId,
      marchandiseId,
      venteId,`;

const putRetoursVentesNew = `const {
      marchandiseId,
      venteId,`;

if (content.includes(putRetoursVentesOld)) {
  content = content.replace(putRetoursVentesOld, putRetoursVentesNew);
  console.log(`  ✅ PUT /api/retours_ventes/:id - userId retiré de req.body`);
  modificationsCount++;
}

// Retirer userId du UPDATE aussi
const putRetoursVentesUpdateOld = `const [result] = await pool.query(
      \`UPDATE retours_ventes SET
         userId = COALESCE(?, userId),
         marchandiseId = COALESCE(?, marchandiseId),`;

const putRetoursVentesUpdateNew = `const [result] = await pool.query(
      \`UPDATE retours_ventes SET
         marchandiseId = COALESCE(?, marchandiseId),`;

if (content.includes(putRetoursVentesUpdateOld)) {
  content = content.replace(putRetoursVentesUpdateOld, putRetoursVentesUpdateNew);
  
  // Retirer userId du tableau de paramètres aussi
  const putRetoursVentesParamsOld = `[userId, marchandiseId, venteId, clientId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],`;
  
  const putRetoursVentesParamsNew = `[marchandiseId, venteId, clientId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],`;
  
  content = content.replace(putRetoursVentesParamsOld, putRetoursVentesParamsNew);
  console.log(`  ✅ PUT /api/retours_ventes/:id - userId retiré du UPDATE`);
  modificationsCount++;
}

// ============================================================================
// 14. CORRIGER POST /api/retours_achats - Retirer userId = 1 de req.body
// ============================================================================
console.log('\n📝 Correction POST /api/retours_achats...');

const postRetoursAchatsOld = `const {
      id,
      userId = 1,
      marchandiseId,
      achatId,`;

const postRetoursAchatsNew = `const {
      id,
      marchandiseId,
      achatId,`;

if (content.includes(postRetoursAchatsOld)) {
  content = content.replace(postRetoursAchatsOld, postRetoursAchatsNew);
  console.log(`  ✅ POST /api/retours_achats - userId = 1 retiré de req.body`);
  modificationsCount++;
}

// ============================================================================
// 15. CORRIGER PUT /api/retours_achats/:id - Retirer userId de req.body
// ============================================================================
console.log('\n📝 Correction PUT /api/retours_achats/:id...');

const putRetoursAchatsOld = `const {
      userId,
      marchandiseId,
      achatId,
      fournisseurId,`;

const putRetoursAchatsNew = `const {
      marchandiseId,
      achatId,
      fournisseurId,`;

if (content.includes(putRetoursAchatsOld)) {
  content = content.replace(putRetoursAchatsOld, putRetoursAchatsNew);
  console.log(`  ✅ PUT /api/retours_achats/:id - userId retiré de req.body`);
  modificationsCount++;
}

// Retirer userId du UPDATE aussi
const putRetoursAchatsUpdateOld = `const [result] = await pool.query(
      \`UPDATE retours_achats SET
         userId = COALESCE(?, userId),
         marchandiseId = COALESCE(?, marchandiseId),`;

const putRetoursAchatsUpdateNew = `const [result] = await pool.query(
      \`UPDATE retours_achats SET
         marchandiseId = COALESCE(?, marchandiseId),`;

if (content.includes(putRetoursAchatsUpdateOld)) {
  content = content.replace(putRetoursAchatsUpdateOld, putRetoursAchatsUpdateNew);
  
  // Retirer userId du tableau de paramètres aussi
  const putRetoursAchatsParamsOld = `[userId, marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],`;
  
  const putRetoursAchatsParamsNew = `[marchandiseId, achatId, fournisseurId, dateRetour, montantTotal,
       statut, raison, notes, deviceId, now, req.params.id],`;
  
  content = content.replace(putRetoursAchatsParamsOld, putRetoursAchatsParamsNew);
  console.log(`  ✅ PUT /api/retours_achats/:id - userId retiré du UPDATE`);
  modificationsCount++;
}

// ============================================================================
// SAUVEGARDER LE FICHIER MODIFIÉ
// ============================================================================
fs.writeFileSync(serverPath, content, 'utf8');

console.log(`\n✅ Modifications terminées!`);
console.log(`📊 Total de modifications: ${modificationsCount}`);
console.log(`📁 Fichier modifié: ${serverPath}`);
console.log(`💾 Sauvegarde: ${backupPath}`);
console.log(`\n🎯 Prochaines étapes:`);
console.log(`   1. Redémarrer le serveur`);
console.log(`   2. Tester avec: node test_auth.js`);
console.log(`   3. Vérifier que les données sont filtrées par userId`);
