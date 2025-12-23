# 🔍 Diagnostic - Erreur ETIMEDOUT MySQL

## ❌ Problème Actuel
```
Error: connect ETIMEDOUT 212.192.3.44:3306
```

**Signification:** Le serveur MySQL n'est **pas accessible** depuis cette machine.

---

## 🔍 Causes Possibles

### **1. Serveur MySQL Non Démarré**
Le serveur MySQL sur `212.192.3.44:3306` n'est pas en cours d'exécution.

**Solution:**
- Vérifier que MySQL est démarré sur le serveur distant
- Se connecter au serveur et vérifier: `systemctl status mysql` (Linux) ou `net start MySQL` (Windows)

---

### **2. Firewall Bloque le Port 3306**
Le firewall bloque les connexions entrantes sur le port 3306.

**Solution:**
```bash
# Sur le serveur MySQL (212.192.3.44)
# Ouvrir le port 3306 dans le firewall
sudo ufw allow 3306/tcp  # Ubuntu/Debian
# ou
firewall-cmd --add-port=3306/tcp --permanent  # CentOS/RHEL
```

---

### **3. MySQL N'Écoute Pas sur Toutes les Interfaces**
MySQL écoute seulement sur `localhost` au lieu de `0.0.0.0`.

**Solution:**
Modifier `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
bind-address = 0.0.0.0  # Au lieu de 127.0.0.1
```

Puis redémarrer MySQL:
```bash
sudo systemctl restart mysql
```

---

### **4. Utilisateur MySQL N'a Pas les Permissions**
L'utilisateur `adnane` n'a pas la permission de se connecter depuis cette IP.

**Solution:**
```sql
-- Se connecter en tant que root MySQL
GRANT ALL PRIVILEGES ON default_db.* TO 'adnane'@'%' IDENTIFIED BY 'adnane123';
FLUSH PRIVILEGES;
```

---

### **5. Réseau Instable**
La connexion réseau entre cette machine et le serveur est instable.

**Solution:**
```bash
# Tester la connectivité
ping 212.192.3.44
telnet 212.192.3.44 3306
```

---

## ✅ Corrections Appliquées dans le Code

### **1. Options Pool MySQL Corrigées**
- ❌ Retiré `acquireTimeout` (invalide)
- ❌ Retiré `timeout` (invalide)
- ✅ Conservé `connectTimeout: 60000` (valide)

### **2. Retry Logic Amélioré**
- Délai progressif: **3s, 6s, 9s** (au lieu de 2s fixe)
- Logs avec informations serveur
- 3 tentatives maximum

### **3. Gestion d'Erreurs Améliorée**
- Messages d'erreur plus clairs
- Code HTTP approprié (503 pour service indisponible)

---

## 🧪 Tests à Effectuer

### **Test 1: Vérifier Connectivité Réseau**
```bash
ping 212.192.3.44
```

### **Test 2: Vérifier Port MySQL**
```bash
telnet 212.192.3.44 3306
# ou
nc -zv 212.192.3.44 3306
```

### **Test 3: Tester Connexion MySQL Directe**
```bash
mysql -h 212.192.3.44 -P 3306 -u adnane -p
# Entrer le mot de passe: adnane123
```

---

## 📝 Configuration Actuelle

**Fichier `.env` (à vérifier):**
```env
DB_HOST=212.192.3.44
DB_PORT=3306
DB_USER=adnane
DB_PASSWORD=adnane123
DB_NAME=default_db
```

---

## 🚀 Solutions Temporaires

### **Option 1: Utiliser MySQL Local**
Si vous avez MySQL en local, modifiez `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=default_db
```

### **Option 2: Utiliser Tunnel SSH**
Si vous avez accès SSH au serveur:
```bash
ssh -L 3306:localhost:3306 user@212.192.3.44
```

Puis dans `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
```

---

## ✅ Résultat Attendu Après Correction

**Si le serveur MySQL est accessible:**
```
✅ Nouvelle connexion MySQL établie
✅ GET /produits: Succès (sans retry)
```

**Si le serveur MySQL n'est pas accessible:**
```
🔄 Reconnexion dans 3 secondes... (1/3)
🔄 Reconnexion dans 6 secondes... (2/3)
❌ Erreur GET /produits: connect ETIMEDOUT
→ Réponse HTTP 500 avec message d'erreur clair
```

---

## 📞 Support

Si le problème persiste après avoir vérifié les points ci-dessus, le problème est probablement:
1. **Serveur MySQL non démarré**
2. **Firewall qui bloque**
3. **MySQL qui n'écoute pas sur toutes les interfaces**

Vérifiez ces points sur le serveur `212.192.3.44`.

