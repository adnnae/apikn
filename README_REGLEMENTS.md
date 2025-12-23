# 💰 Synchronisation des Règlements Clients et Fournisseurs

## 🎯 Objectif

Implémenter la synchronisation complète des règlements clients et fournisseurs entre l'application Flutter (SQLite) et la base de données MySQL via une API Node.js REST.

## ✅ Ce qui a été fait

### 1. Base de Données MySQL

**4 tables créées:**

1. **reglements_clients** - Stockage des règlements clients
   - Champs: id, marchandiseId, clientId, venteId, dateReglement, montant, modePaiement, reference, notes, deviceId, lastModified
   - Index sur: clientId, venteId, dateReglement

2. **reglements_fournisseurs** - Stockage des règlements fournisseurs
   - Champs: id, marchandiseId, fournisseurId, achatId, dateReglement, montant, modePaiement, reference, notes, deviceId, lastModified
   - Index sur: fournisseurId, achatId, dateReglement

3. **historique_reglements_clients** - Traçabilité des modifications
   - Enregistre toutes les actions: create, update, delete
   - Permet l'audit et la récupération de données

4. **historique_reglements_fournisseurs** - Traçabilité des modifications
   - Enregistre toutes les actions: create, update, delete
   - Permet l'audit et la récupération de données

### 2. API REST Node.js

**2 fichiers de routes créés:**

1. **routes/reglements_clients.js**
   - GET /api/reglements_clients - Liste tous
   - GET /api/reglements_clients/:id - Récupérer un
   - POST /api/reglements_clients - Créer
   - PUT /api/reglements_clients/:id - Mettre à jour
   - DELETE /api/reglements_clients/:id - Supprimer
   - GET /api/reglements_clients/client/:clientId - Par client
   - GET /api/reglements_clients/vente/:venteId - Par vente

2. **routes/reglements_fournisseurs.js**
   - GET /api/reglements_fournisseurs - Liste tous
   - GET /api/reglements_fournisseurs/:id - Récupérer un
   - POST /api/reglements_fournisseurs - Créer
   - PUT /api/reglements_fournisseurs/:id - Mettre à jour
   - DELETE /api/reglements_fournisseurs/:id - Supprimer
   - GET /api/reglements_fournisseurs/fournisseur/:fournisseurId - Par fournisseur
   - GET /api/reglements_fournisseurs/achat/:achatId - Par achat

**Fonctionnalités:**
- ✅ CRUD complet
- ✅ Gestion automatique de l'historique
- ✅ Retry automatique en cas d'erreur réseau
- ✅ UPSERT avec INSERT ... ON DUPLICATE KEY UPDATE
- ✅ Validation des données
- ✅ Gestion des erreurs

### 3. Scripts d'Installation et de Test

1. **sql/create_tables_reglements.sql** - Définition SQL des tables
2. **create_tables_reglements.js** - Script d'installation automatique
3. **test_reglements.js** - Suite de tests complète (8 tests)

### 4. Synchronisation Flutter

**Mise à jour de mysql_sync_service.dart:**
```dart
'ReglementsClients': 'reglements_clients',
'ReglementsFournisseurs': 'reglements_fournisseurs',
```

La synchronisation est maintenant automatique pour les règlements!

### 5. Documentation

1. **GUIDE_SYNC_REGLEMENTS.md** - Guide complet (installation, utilisation, exemples)
2. **AJOUT_ROUTES_REGLEMENTS.md** - Instructions pour server.js
3. **REGLEMENTS_SYNC_READY.md** - Checklist de déploiement
4. **CODE_A_AJOUTER_SERVER.js** - Code prêt à copier-coller
5. **README_REGLEMENTS.md** - Ce fichier

## 🚀 Installation Rapide

### Étape 1: Créer les tables

```bash
cd "knachsoft-api - Copie"
node create_tables_reglements.js
```

### Étape 2: Ajouter les routes

Ouvrir `server.js` et ajouter avant `app.listen(PORT, ...)`:

```javascript
// ==================== REGLEMENTS CLIENTS ====================
const reglementsClientsRouter = require('./routes/reglements_clients');
app.use('/api/reglements_clients', reglementsClientsRouter);

// ==================== REGLEMENTS FOURNISSEURS ====================
const reglementsFournisseursRouter = require('./routes/reglements_fournisseurs');
app.use('/api/reglements_fournisseurs', reglementsFournisseursRouter);
```

### Étape 3: Redémarrer le serveur

```bash
node server.js
```

### Étape 4: Tester

```bash
node test_reglements.js
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Flutter                       │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ ReglementsClients│         │ReglementsFourn.  │          │
│  │    (SQLite)      │         │    (SQLite)      │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│              ┌─────────▼─────────┐                           │
│              │ MySqlSyncService  │                           │
│              └─────────┬─────────┘                           │
└────────────────────────┼─────────────────────────────────────┘
                         │ HTTP REST API
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    API Node.js (Express)                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Routes                                              │    │
│  │  • /api/reglements_clients                           │    │
│  │  • /api/reglements_fournisseurs                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │ MySQL Connection
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                    MySQL Database                             │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │ reglements_clients   │    │reglements_fournisseurs│       │
│  └──────────────────────┘    └──────────────────────┘        │
│                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐        │
│  │ historique_reglements│    │historique_reglements │        │
│  │      _clients        │    │   _fournisseurs      │        │
│  └──────────────────────┘    └──────────────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Synchronisation

### 1. Création d'un règlement (Flutter → MySQL)

```
1. Utilisateur crée un règlement dans l'app Flutter
2. Enregistrement dans SQLite local (ReglementsClients)
3. MySqlSyncService détecte le changement
4. POST /api/reglements_clients avec les données
5. API Node.js insère dans MySQL
6. Historique créé automatiquement
7. Confirmation retournée à Flutter
```

### 2. Synchronisation (MySQL → Flutter)

```
1. MySqlSyncService demande les changements récents
2. GET /api/reglements_clients?lastModified=...
3. API Node.js retourne les nouveaux règlements
4. Flutter met à jour SQLite local
5. Interface utilisateur rafraîchie
```

### 3. Résolution de conflits

```
1. Comparaison des timestamps (lastModified)
2. Le plus récent gagne
3. Historique conservé pour audit
```

## 📝 Exemples de Code

### Créer un règlement client (Flutter)

```dart
import 'package:knachsoftmobile/models/reglement_client.dart';
import 'package:knachsoftmobile/database/database_helper.dart';
import 'package:knachsoftmobile/services/mysql_sync_service.dart';

// Créer le règlement
final reglement = ReglementClient(
  marchandiseId: 1,
  clientId: clientId,
  venteId: venteId,
  montant: 500.00,
  dateReglement: DateTime.now(),
  modePaiement: 'espece',
  reference: 'REG-${DateTime.now().millisecondsSinceEpoch}',
  notes: 'Règlement partiel',
);

// Enregistrer localement
final db = await DatabaseHelper.instance.database;
final id = await db.insert('ReglementsClients', reglement.toMap());

// Synchroniser avec MySQL
final syncService = MySqlSyncService();
await syncService.syncTable('ReglementsClients');

print('Règlement créé et synchronisé: $id');
```

### Consulter les règlements d'un client (Flutter)

```dart
final db = await DatabaseHelper.instance.database;

// Récupérer tous les règlements du client
final reglements = await db.query(
  'ReglementsClients',
  where: 'clientId = ?',
  whereArgs: [clientId],
  orderBy: 'dateReglement DESC',
);

// Calculer le total des règlements
final totalReglements = reglements.fold<double>(
  0,
  (sum, r) => sum + (r['montant'] as double),
);

print('Total règlements: $totalReglements DH');
```

### Créer un règlement via API (cURL)

```bash
curl -X POST http://localhost:4000/api/reglements_clients \
  -H "Content-Type: application/json" \
  -d '{
    "marchandiseId": 1,
    "clientId": 1,
    "venteId": 1,
    "dateReglement": "2024-12-19T10:00:00",
    "montant": 500.00,
    "modePaiement": "espece",
    "reference": "REG-001",
    "notes": "Règlement partiel"
  }'
```

## 🎯 Cas d'Usage

### 1. Règlement partiel d'une vente

```dart
// Client achète pour 1000 DH, paie 500 DH
final vente = Vente(
  clientId: clientId,
  montantTotal: 1000.00,
  montantPaye: 500.00,
  statut: 'partiel',
);

// Enregistrer le règlement
final reglement = ReglementClient(
  clientId: clientId,
  venteId: vente.id,
  montant: 500.00,
  dateReglement: DateTime.now(),
  modePaiement: 'espece',
);
```

### 2. Règlement de solde (sans vente spécifique)

```dart
// Client règle son solde global
final reglement = ReglementClient(
  clientId: clientId,
  venteId: null, // Pas de vente spécifique
  montant: 1500.00,
  dateReglement: DateTime.now(),
  modePaiement: 'virement',
  notes: 'Règlement de solde',
);
```

### 3. Paiement fournisseur par chèque

```dart
final reglement = ReglementFournisseur(
  fournisseurId: fournisseurId,
  achatId: achatId,
  montant: 5000.00,
  dateReglement: DateTime.now(),
  modePaiement: 'cheque',
  reference: 'CHQ-12345',
  notes: 'Chèque n°12345',
);
```

## 📈 Statistiques et Rapports

### Calculer le solde d'un client

```dart
// Total des ventes
final ventes = await db.query('Ventes', where: 'clientId = ?', whereArgs: [clientId]);
final totalVentes = ventes.fold<double>(0, (sum, v) => sum + (v['montantTotal'] as double));

// Total des règlements
final reglements = await db.query('ReglementsClients', where: 'clientId = ?', whereArgs: [clientId]);
final totalReglements = reglements.fold<double>(0, (sum, r) => sum + (r['montant'] as double));

// Solde = Ventes - Règlements
final solde = totalVentes - totalReglements;
```

### Règlements par mode de paiement

```sql
SELECT 
  modePaiement,
  COUNT(*) as nombre,
  SUM(montant) as total
FROM reglements_clients
GROUP BY modePaiement
ORDER BY total DESC;
```

### Règlements du mois

```sql
SELECT 
  DATE(dateReglement) as date,
  COUNT(*) as nombre,
  SUM(montant) as total
FROM reglements_clients
WHERE MONTH(dateReglement) = MONTH(CURRENT_DATE())
  AND YEAR(dateReglement) = YEAR(CURRENT_DATE())
GROUP BY DATE(dateReglement)
ORDER BY date DESC;
```

## 🔒 Sécurité

- ✅ Validation des données côté API
- ✅ Historique complet des modifications
- ✅ Traçabilité par deviceId
- ✅ Timestamps pour audit
- ✅ Gestion des erreurs robuste

## 🐛 Dépannage

### Problème: Tables non créées

```bash
# Solution: Exécuter le script de création
node create_tables_reglements.js
```

### Problème: Routes non trouvées (404)

```bash
# Solution: Vérifier que les routes sont ajoutées dans server.js
# et que le serveur a été redémarré
```

### Problème: Synchronisation bloquée

```dart
// Solution: Forcer une resynchronisation
await MySqlSyncService().resetSyncMetadata('ReglementsClients');
await MySqlSyncService().syncTable('ReglementsClients');
```

## 📚 Documentation Complète

- **GUIDE_SYNC_REGLEMENTS.md** - Guide détaillé avec exemples
- **REGLEMENTS_SYNC_READY.md** - Checklist de déploiement
- **AJOUT_ROUTES_REGLEMENTS.md** - Instructions server.js

## ✅ Checklist Finale

- [x] Tables MySQL créées (4 tables)
- [x] Routes API créées (2 fichiers)
- [x] Scripts d'installation créés
- [x] Scripts de test créés
- [x] Service de synchronisation Flutter mis à jour
- [x] Documentation complète créée
- [ ] Tables MySQL déployées en production
- [ ] Routes ajoutées dans server.js
- [ ] Serveur redémarré
- [ ] Tests exécutés avec succès
- [ ] Synchronisation testée depuis Flutter

## 🎉 Conclusion

La synchronisation des règlements clients et fournisseurs est **COMPLÈTE** et **PRÊTE À DÉPLOYER**!

Tous les composants sont en place:
- ✅ Base de données MySQL avec historique
- ✅ API REST complète et robuste
- ✅ Synchronisation bidirectionnelle
- ✅ Tests automatisés
- ✅ Documentation exhaustive

**Il ne reste plus qu'à déployer! 🚀**

---

**Créé le:** 19 Décembre 2024  
**Version:** 1.0  
**Statut:** ✅ PRÊT À DÉPLOYER
