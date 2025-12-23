# Guide Complet - Synchronisation des Règlements Clients et Fournisseurs

## 📋 Vue d'ensemble

Ce guide explique comment synchroniser les règlements clients et fournisseurs entre l'application Flutter (SQLite) et MySQL via l'API Node.js.

## 🗄️ Structure des Tables

### Table `reglements_clients`
```sql
CREATE TABLE reglements_clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marchandiseId INT NOT NULL,
  clientId INT NOT NULL,
  venteId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50) DEFAULT 'espece',
  reference VARCHAR(255),
  notes TEXT,
  deviceId VARCHAR(100),
  lastModified DATETIME
);
```

### Table `reglements_fournisseurs`
```sql
CREATE TABLE reglements_fournisseurs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marchandiseId INT NOT NULL,
  fournisseurId INT NOT NULL,
  achatId INT,
  dateReglement DATETIME NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  modePaiement VARCHAR(50) DEFAULT 'espece',
  reference VARCHAR(255),
  notes TEXT,
  deviceId VARCHAR(100),
  lastModified DATETIME
);
```

### Tables d'Historique
- `historique_reglements_clients` - Traçabilité des modifications
- `historique_reglements_fournisseurs` - Traçabilité des modifications

## 🚀 Installation

### Étape 1: Créer les tables MySQL

```bash
cd "knachsoft-api - Copie"
node create_tables_reglements.js
```

Cela va créer:
- ✅ `reglements_clients`
- ✅ `reglements_fournisseurs`
- ✅ `historique_reglements_clients`
- ✅ `historique_reglements_fournisseurs`

### Étape 2: Ajouter les routes dans server.js

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

Vérifier que le serveur démarre sans erreur et affiche:
```
✅ API MySQL démarrée sur http://localhost:4000
```

## 📡 Endpoints API

### Règlements Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reglements_clients` | Liste tous les règlements |
| GET | `/api/reglements_clients/:id` | Récupérer un règlement |
| POST | `/api/reglements_clients` | Créer un règlement |
| PUT | `/api/reglements_clients/:id` | Mettre à jour un règlement |
| DELETE | `/api/reglements_clients/:id` | Supprimer un règlement |
| GET | `/api/reglements_clients/client/:clientId` | Règlements d'un client |
| GET | `/api/reglements_clients/vente/:venteId` | Règlements d'une vente |

### Règlements Fournisseurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reglements_fournisseurs` | Liste tous les règlements |
| GET | `/api/reglements_fournisseurs/:id` | Récupérer un règlement |
| POST | `/api/reglements_fournisseurs` | Créer un règlement |
| PUT | `/api/reglements_fournisseurs/:id` | Mettre à jour un règlement |
| DELETE | `/api/reglements_fournisseurs/:id` | Supprimer un règlement |
| GET | `/api/reglements_fournisseurs/fournisseur/:fournisseurId` | Règlements d'un fournisseur |
| GET | `/api/reglements_fournisseurs/achat/:achatId` | Règlements d'un achat |

## 🧪 Test des Endpoints

### Test Règlement Client

```bash
# Créer un règlement client
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

# Récupérer tous les règlements
curl http://localhost:4000/api/reglements_clients

# Récupérer les règlements d'un client
curl http://localhost:4000/api/reglements_clients/client/1
```

### Test Règlement Fournisseur

```bash
# Créer un règlement fournisseur
curl -X POST http://localhost:4000/api/reglements_fournisseurs \
  -H "Content-Type: application/json" \
  -d '{
    "marchandiseId": 1,
    "fournisseurId": 1,
    "achatId": 1,
    "dateReglement": "2024-12-19T10:00:00",
    "montant": 1000.00,
    "modePaiement": "cheque",
    "reference": "CHQ-12345",
    "notes": "Paiement fournisseur"
  }'

# Récupérer tous les règlements
curl http://localhost:4000/api/reglements_fournisseurs

# Récupérer les règlements d'un fournisseur
curl http://localhost:4000/api/reglements_fournisseurs/fournisseur/1
```

## 🔄 Synchronisation Flutter

La synchronisation est automatique via `MySqlSyncService`. Les tables sont déjà mappées:

```dart
'ReglementsClients': 'reglements_clients',
'ReglementsFournisseurs': 'reglements_fournisseurs',
```

### Déclencher une synchronisation manuelle

Dans l'application Flutter:

```dart
import 'package:knachsoftmobile/services/mysql_sync_service.dart';

// Synchroniser tous les règlements
final syncService = MySqlSyncService();
await syncService.syncAllTables();

// Ou synchroniser une table spécifique
await syncService.syncTable('ReglementsClients');
await syncService.syncTable('ReglementsFournisseurs');
```

## 📊 Modèles de Données

### ReglementClient (Dart)

```dart
class ReglementClient {
  final int? id;
  final int marchandiseId;
  final int clientId;
  final int? venteId;
  final double montant;
  final DateTime dateReglement;
  final String modePaiement;
  final String? reference;
  final String? notes;
}
```

### ReglementFournisseur (Dart)

```dart
class ReglementFournisseur {
  final int? id;
  final int marchandiseId;
  final int fournisseurId;
  final int? achatId;
  final double montant;
  final DateTime dateReglement;
  final String modePaiement;
  final String? reference;
  final String? notes;
}
```

## 🔍 Vérification

### Vérifier les tables créées

```sql
-- Connexion MySQL
mysql -h 212.192.3.44 -u adnane -p default_db

-- Lister les tables
SHOW TABLES LIKE '%reglement%';

-- Vérifier la structure
DESCRIBE reglements_clients;
DESCRIBE reglements_fournisseurs;

-- Compter les enregistrements
SELECT COUNT(*) FROM reglements_clients;
SELECT COUNT(*) FROM reglements_fournisseurs;
```

### Vérifier l'historique

```sql
-- Voir les dernières actions
SELECT * FROM historique_reglements_clients 
ORDER BY dateAction DESC LIMIT 10;

SELECT * FROM historique_reglements_fournisseurs 
ORDER BY dateAction DESC LIMIT 10;
```

## 🎯 Cas d'Usage

### 1. Enregistrer un règlement client

```dart
final reglement = ReglementClient(
  marchandiseId: 1,
  clientId: clientId,
  venteId: venteId,
  montant: 500.00,
  dateReglement: DateTime.now(),
  modePaiement: 'espece',
  reference: 'REG-001',
  notes: 'Règlement partiel',
);

// Insérer dans SQLite
final db = await DatabaseHelper.instance.database;
final id = await db.insert('ReglementsClients', reglement.toMap());

// La synchronisation se fera automatiquement
```

### 2. Consulter les règlements d'un client

```dart
final db = await DatabaseHelper.instance.database;
final reglements = await db.query(
  'ReglementsClients',
  where: 'clientId = ?',
  whereArgs: [clientId],
  orderBy: 'dateReglement DESC',
);
```

### 3. Calculer le solde client

```dart
// Total des ventes
final ventes = await db.query('Ventes', where: 'clientId = ?', whereArgs: [clientId]);
final totalVentes = ventes.fold<double>(0, (sum, v) => sum + (v['montantTotal'] as double));

// Total des règlements
final reglements = await db.query('ReglementsClients', where: 'clientId = ?', whereArgs: [clientId]);
final totalReglements = reglements.fold<double>(0, (sum, r) => sum + (r['montant'] as double));

// Solde = Total ventes - Total règlements
final solde = totalVentes - totalReglements;
```

## ⚠️ Points Importants

1. **Modes de paiement supportés**: espece, cheque, virement, carte, autre
2. **Historique**: Toutes les modifications sont tracées dans les tables d'historique
3. **Synchronisation**: Bidirectionnelle (SQLite ↔ MySQL)
4. **Conflits**: Résolution basée sur `lastModified` (le plus récent gagne)
5. **Retry**: 3 tentatives automatiques en cas d'erreur réseau

## 🐛 Dépannage

### Erreur: Table doesn't exist

```bash
# Recréer les tables
node create_tables_reglements.js
```

### Erreur: Cannot connect to MySQL

```bash
# Vérifier la connexion
node -e "require('./db').testConnection().then(() => console.log('OK')).catch(console.error)"
```

### Synchronisation bloquée

```dart
// Forcer une resynchronisation complète
await syncService.resetSyncMetadata('ReglementsClients');
await syncService.syncTable('ReglementsClients');
```

## ✅ Checklist de Déploiement

- [ ] Tables MySQL créées
- [ ] Routes ajoutées dans server.js
- [ ] Serveur Node.js redémarré
- [ ] Tests API réussis
- [ ] Mapping Flutter mis à jour
- [ ] Test de synchronisation réussi
- [ ] Vérification des données dans MySQL

## 📝 Notes

- Les règlements sont liés aux ventes/achats via `venteId`/`achatId`
- Un règlement peut être indépendant (règlement de solde)
- L'historique permet de tracer toutes les modifications
- La synchronisation est automatique et transparente
