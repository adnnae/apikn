const { pool } = require('./db');

async function setupDataSharing() {
  console.log('\n🔧 CONFIGURATION DU PARTAGE DE DONNÉES\n');
  console.log('Cette solution permet de partager les données sans modifier les routes API\n');

  try {
    // 1. Récupérer tous les utilisateurs avec leur ownerId
    const [users] = await pool.query(`
      SELECT id, username, role, ownerId 
      FROM users 
      ORDER BY ownerId, role DESC
    `);

    console.log('📊 Utilisateurs trouvés:');
    users.forEach((user) => {
      const badge = user.role === 'admin' ? '👑' : '👤';
      console.log(`   ${badge} ${user.username} (id=${user.id}, ownerId=${user.ownerId})`);
    });

    // 2. Grouper par ownerId
    const groups = {};
    users.forEach((user) => {
      const ownerId = user.ownerId || user.id;
      if (!groups[ownerId]) {
        groups[ownerId] = [];
      }
      groups[ownerId].push(user);
    });

    console.log('\n📋 Groupes de partage:');
    for (const [ownerId, groupUsers] of Object.entries(groups)) {
      console.log(`\n   Groupe ownerId=${ownerId}:`);
      groupUsers.forEach((u) => {
        console.log(`      - ${u.username} (id=${u.id})`);
      });
    }

    // 3. Pour chaque groupe, mettre à jour les données
    for (const [ownerId, groupUsers] of Object.entries(groups)) {
      const adminId = parseInt(ownerId);
      const vendeurIds = groupUsers.filter((u) => u.id !== adminId).map((u) => u.id);

      if (vendeurIds.length === 0) {
        console.log(`\n⏭️  Groupe ${ownerId}: Pas de vendeurs, skip`);
        continue;
      }

      console.log(`\n🔄 Groupe ${ownerId}: Mise à jour des données...`);
      console.log(`   Admin: ${adminId}`);
      console.log(`   Vendeurs: ${vendeurIds.join(', ')}`);

      // Liste des tables à mettre à jour
      const tables = [
        'produits',
        'clients',
        'fournisseurs',
        'ventes',
        'achats',
        'lignes_vente',
        'lignes_achat',
        'devis',
        'factures',
        'reglements_clients',
        'reglements_fournisseurs',
        'depenses',
        'categories',
        'retours_vente',
        'retours_achat',
        'lignes_retours_vente',
        'lignes_retours_achat',
      ];

      for (const table of tables) {
        try {
          // Vérifier si la table existe
          const [tableExists] = await pool.query(
            `SHOW TABLES LIKE '${table}'`,
          );

          if (tableExists.length === 0) {
            console.log(`   ⏭️  ${table}: Table n'existe pas, skip`);
            continue;
          }

          // Mettre à jour les données des vendeurs pour utiliser l'id de l'admin
          for (const vendeurId of vendeurIds) {
            const [result] = await pool.query(
              `UPDATE ${table} SET userId = ? WHERE userId = ?`,
              [adminId, vendeurId],
            );

            if (result.affectedRows > 0) {
              console.log(
                `   ✅ ${table}: ${result.affectedRows} ligne(s) mise(s) à jour (vendeur ${vendeurId} → admin ${adminId})`,
              );
            }
          }
        } catch (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      }
    }

    // 4. Créer les triggers pour automatiser le partage futur
    console.log('\n🔧 Création des triggers pour le partage automatique...');

    const triggerTables = ['ventes', 'achats', 'clients', 'produits', 'fournisseurs'];

    for (const table of triggerTables) {
      try {
        // Supprimer le trigger s'il existe
        await pool.query(`DROP TRIGGER IF EXISTS before_insert_${table}_shared`);

        // Créer le trigger
        await pool.query(`
          CREATE TRIGGER before_insert_${table}_shared
          BEFORE INSERT ON ${table}
          FOR EACH ROW
          BEGIN
            DECLARE owner_id INT;
            SELECT ownerId INTO owner_id FROM users WHERE id = NEW.userId LIMIT 1;
            IF owner_id IS NOT NULL THEN
              SET NEW.userId = owner_id;
            END IF;
          END
        `);

        console.log(`   ✅ Trigger créé pour ${table}`);
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONFIGURATION TERMINÉE');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log('   - Les données sont maintenant partagées entre admin et vendeurs');
    console.log('   - Les nouveaux enregistrements seront automatiquement partagés');
    console.log('   - Aucune modification des routes API nécessaire');
    console.log('\n🧪 Testez maintenant:');
    console.log('   1. Connectez-vous avec le vendeur');
    console.log('   2. Vérifiez que vous voyez les mêmes données que l\'admin');
    console.log('   3. Créez une vente avec le vendeur');
    console.log('   4. Vérifiez que l\'admin voit cette vente\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

setupDataSharing();
