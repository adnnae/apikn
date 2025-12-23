# Ajout des Routes pour les Règlements Clients et Fournisseurs

## Instructions

Ajouter ces lignes dans `server.js` après les autres routes (avant `app.listen`):

```javascript
// ==================== REGLEMENTS CLIENTS ====================
const reglementsClientsRouter = require('./routes/reglements_clients');
app.use('/api/reglements_clients', reglementsClientsRouter);

// ==================== REGLEMENTS FOURNISSEURS ====================
const reglementsFournisseursRouter = require('./routes/reglements_fournisseurs');
app.use('/api/reglements_fournisseurs', reglementsFournisseursRouter);
```

## Vérification

Après avoir ajouté ces routes, redémarrer le serveur:

```bash
cd "knachsoft-api - Copie"
node server.js
```

Les endpoints suivants seront disponibles:

### Règlements Clients
- `GET /api/reglements_clients` - Liste tous les règlements clients
- `GET /api/reglements_clients/:id` - Récupérer un règlement par ID
- `POST /api/reglements_clients` - Créer un nouveau règlement
- `PUT /api/reglements_clients/:id` - Mettre à jour un règlement
- `DELETE /api/reglements_clients/:id` - Supprimer un règlement
- `GET /api/reglements_clients/client/:clientId` - Règlements d'un client
- `GET /api/reglements_clients/vente/:venteId` - Règlements d'une vente

### Règlements Fournisseurs
- `GET /api/reglements_fournisseurs` - Liste tous les règlements fournisseurs
- `GET /api/reglements_fournisseurs/:id` - Récupérer un règlement par ID
- `POST /api/reglements_fournisseurs` - Créer un nouveau règlement
- `PUT /api/reglements_fournisseurs/:id` - Mettre à jour un règlement
- `DELETE /api/reglements_fournisseurs/:id` - Supprimer un règlement
- `GET /api/reglements_fournisseurs/fournisseur/:fournisseurId` - Règlements d'un fournisseur
- `GET /api/reglements_fournisseurs/achat/:achatId` - Règlements d'un achat
