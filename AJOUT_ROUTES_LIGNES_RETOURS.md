# Ajout des routes pour les lignes de retours

## Instructions

Ajoutez ces lignes dans votre fichier `server.js` :

### 1. Après les imports existants (vers le début du fichier), ajoutez :

```javascript
// Routes pour les lignes de retours
const lignesRetourVenteRouter = require('./routes/lignes_retour_vente');
const lignesRetourAchatRouter = require('./routes/lignes_retour_achat');
```

### 2. Après les routes existantes (après les routes retours_ventes et retours_achats), ajoutez :

```javascript
// ==================== LIGNES RETOUR VENTE ====================
app.use('/api/lignes_retour_vente', lignesRetourVenteRouter);

// ==================== LIGNES RETOUR ACHAT ====================
app.use('/api/lignes_retour_achat', lignesRetourAchatRouter);
```

## Vérification

Après avoir ajouté ces routes, redémarrez votre serveur Node.js :

```bash
cd "knachsoft-api - Copie"
node server.js
```

Les endpoints suivants seront disponibles :

- `GET /api/lignes_retour_vente` - Liste toutes les lignes de retour vente
- `POST /api/lignes_retour_vente` - Créer une ligne de retour vente
- `PUT /api/lignes_retour_vente/:id` - Mettre à jour une ligne
- `DELETE /api/lignes_retour_vente/:id` - Supprimer une ligne

- `GET /api/lignes_retour_achat` - Liste toutes les lignes de retour achat
- `POST /api/lignes_retour_achat` - Créer une ligne de retour achat
- `PUT /api/lignes_retour_achat/:id` - Mettre à jour une ligne
- `DELETE /api/lignes_retour_achat/:id` - Supprimer une ligne
