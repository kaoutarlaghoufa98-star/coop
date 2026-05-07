# 🥐 COOP TAFERNOUT — Application Desktop

Système de gestion pour pâtisserie coopérative — Version structurée.

---

## 📁 Structure du projet

```
coop-tafernout/
├── main.js              ← Processus principal Electron
├── preload.js           ← Bridge sécurisé Electron ↔ HTML
├── package.json         ← Config npm / electron-builder
├── generate.py          ← Script Python pour injecter des données
├── requirements.txt     ← Dépendances Python
│
└── src/                 ← Application web
    ├── index.html       ← Point d'entrée HTML
    ├── app.jsx          ← Racine React (App + login)
    │
    ├── styles/
    │   └── main.css     ← Tous les styles CSS
    │
    ├── data/
    │   └── initialData.js   ← Données initiales (produits, clients, etc.)
    │
    ├── utils/
    │   ├── helpers.js       ← Fonctions utilitaires (fmt, td…)
    │   ├── store.js         ← Gestion d'état + persistance
    │   └── printHelpers.js  ← Génération HTML pour impression
    │
    └── components/
        ├── shared/
        │   ├── Toast.jsx    ← Notification temporaire
        │   ├── Panel.jsx    ← Panneau latéral + aperçu facture
        │   └── ImgUp.jsx    ← Upload d'image base64
        │
        ├── Login.jsx        ← Page de connexion
        ├── Dashboard.jsx    ← Tableau de bord + graphiques
        ├── POS.jsx          ← Point de vente (caisse)
        ├── Products.jsx     ← Catalogue produits
        ├── Clients.jsx      ← Clients & créances
        ├── Stock.jsx        ← Stock matières premières
        ├── Charges.jsx      ← Charges & pertes
        ├── Invoices.jsx     ← Factures
        ├── Commandes.jsx    ← Commandes clients (Kanban)
        ├── Personnel.jsx    ← Gestion du personnel
        ├── Users.jsx        ← Utilisateurs & permissions
        ├── Parametres.jsx   ← Paramètres & thèmes
        └── AppShell.jsx     ← Shell principal (sidebar + routing)
```

---

## 🚀 Lancement rapide (Electron)

### Prérequis
- [Node.js](https://nodejs.org) (v18+)
- npm (inclus avec Node.js)

### Installation et démarrage

```bash
# 1. Installer les dépendances Electron
npm install

# 2. Lancer en mode développement
npm start
```

---

## 🐍 Lancement avec Python (alternative)

```bash
# 1. Installer les dépendances Python
pip install -r requirements.txt

# 2. Lancer l'application
python main.py
```

---

## 📦 Créer l'installateur Windows (.exe)

```bash
npm run build
# → Le fichier .exe se trouve dans dist/
```

---

## ☁️ Configuration Firebase (Synchronisation Hybride)

L'application supporte maintenant la synchronisation hybride : elle fonctionne **hors ligne** et se synchronise automatiquement avec le cloud quand une connexion internet est disponible.

### Étapes de configuration

1. **Créer un projet Firebase** :
   - Aller sur [Firebase Console](https://console.firebase.google.com)
   - Créer un nouveau projet
   - Activer Firestore Database

2. **Configurer l'application** :
   - Ouvrir `main.js`
   - Remplacer la configuration Firebase par vos clés :
     ```javascript
     const firebaseConfig = {
       apiKey: "votre-api-key",
       authDomain: "votre-projet.firebaseapp.com",
       projectId: "votre-project-id",
       storageBucket: "votre-projet.appspot.com",
       messagingSenderId: "123456789",
       appId: "votre-app-id"
     };
     ```

3. **Règles Firestore** (pour la sécurité) :
   - Dans Firebase Console > Firestore > Rules :
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /app/{document} {
           allow read, write: if true; // Ajuster selon vos besoins de sécurité
         }
       }
     }
     ```

### Fonctionnement
- **Hors ligne** : L'application utilise le cache local
- **En ligne** : Synchronisation automatique avec Firestore
- **Multi-appareils** : Avec la même configuration Firebase, les données se synchronisent entre appareils

---

## 🔑 Identifiants par défaut

| Utilisateur      | Login    | Mot de passe | Accès          |
|-----------------|----------|--------------|----------------|
| Fatima Zahra    | `admin`  | `admin123`   | Tout           |
| Khadija Benali  | `khadija`| `pass123`    | Vente, Clients |
| Hassan Tazi     | `hassan` | `pass123`    | Stock, Produits|

---

## 🎨 Personnaliser les données initiales

Modifiez **`src/data/initialData.js`** pour changer :
- Les produits (nom, prix, catégorie…)
- Les clients de départ
- Les employés
- Les matières premières

> ⚠️ Ces données ne s'appliquent qu'à la **première installation** (quand il n'y a pas encore de sauvegarde locale).

---

## 💾 Où sont sauvegardées les données ?

**Mode Electron :** `%APPDATA%\coop-tafernout\tafernout_data.json`  
**Mode navigateur :** `localStorage` du navigateur

---

## 📝 Ajouter un nouveau module

1. Créer `src/components/MonModule.jsx`
2. Ajouter `<script type="text/babel" src="components/MonModule.jsx"></script>` dans `index.html`
3. Ajouter l'entrée dans le tableau `NAV` de `AppShell.jsx`
4. Ajouter le rendu conditionnel dans `AppShell.jsx`
