# 🐍 Outils Python — Coop Tafernout

Ce dossier contient 4 outils Python indépendants qui complètent l'application.
Ils lisent tous le fichier `tafernout_data.json` généré par l'application Electron.

---

## 📋 Prérequis

```bash
python --version   # Python 3.8 ou supérieur requis
```

Pour l'export Excel (optionnel) :
```bash
pip install openpyxl
```

---

## 🛠️ Les 4 outils

### 1. `rapport_financier.py` — Rapport financier HTML

Génère un rapport financier mensuel complet en HTML.

```bash
python python_tools/rapport_financier.py
```

**Produit :** `rapport_financier.html` (ouvrez dans votre navigateur pour imprimer)

**Contenu :**
- KPIs : ventes, charges, bénéfice net, créances, masse salariale
- Graphiques en barres par catégorie (ventes et charges)
- Top 5 produits vendus
- Liste des clients débiteurs

---

### 2. `alertes_stock.py` — Vérificateur d'alertes stock

Analyse les stocks et génère des recommandations de commande.

```bash
python python_tools/alertes_stock.py
```

**Produit :** `alertes_stock.txt` + affichage coloré dans le terminal

**Contenu :**
- Ruptures de matières premières (stock = 0)
- Stocks faibles (stock ≤ minimum)
- Alertes produits finis
- Liste des commandes fournisseurs suggérées (quantité à commander)

---

### 3. `fiche_paie.py` — Générateur de fiches de paie

Génère les bulletins de paie mensuels de tous les employés actifs.

```bash
python python_tools/fiche_paie.py
```

**Produit :** dossier `fiches_paie/` avec un fichier HTML par employé

**Contenu :**
- Calcul automatique CNSS (4,48%), AMO (2,26%) et IR (barème progressif)
- Salaire brut → net avec détail des retenues
- Ancienneté calculée automatiquement
- Format bulletin de paie imprimable

---

### 4. `sauvegarde.py` — Gestionnaire de sauvegardes

Crée, liste, restaure et purge les sauvegardes des données.

```bash
# Créer une sauvegarde
python python_tools/sauvegarde.py

# Créer avec étiquette
python python_tools/sauvegarde.py --label "avant migration"

# Lister les sauvegardes disponibles
python python_tools/sauvegarde.py --liste

# Restaurer la sauvegarde n°2 (selon la liste)
python python_tools/sauvegarde.py --restaurer 2

# Restaurer la plus récente
python python_tools/sauvegarde.py --restaurer-last

# Purger les sauvegardes anciennes (garde les 10 dernières)
python python_tools/sauvegarde.py --purge
```

**Produit :** dossier `sauvegardes/` avec fichiers JSON horodatés

---

### 5. `export_excel.py` — Export CSV / Excel

Exporte toutes les données vers des fichiers CSV (et Excel si openpyxl est installé).

```bash
python python_tools/export_excel.py
```

**Produit :** dossier `exports/export_YYYYMMDD_HHMM/` avec :
- `produits_*.csv`
- `ventes_*.csv`
- `clients_*.csv`
- `charges_*.csv`
- `employes_*.csv`
- `matieres_*.csv`
- `commandes_*.csv`
- `tafernout_complet_*.xlsx` (si openpyxl installé)

---

## 📂 Structure des fichiers générés

```
coop-tafernout/
├── tafernout_data.json          ← Données de l'application
├── rapport_financier.html       ← Rapport financier (outil 1)
├── alertes_stock.txt            ← Rapport alertes (outil 2)
├── fiches_paie/                 ← Fiches de paie HTML (outil 3)
│   ├── paie_fatima_zahra_202505.html
│   └── ...
├── sauvegardes/                 ← Sauvegardes JSON (outil 4)
│   ├── tafernout_backup_20250503_...json
│   └── ...
└── exports/                     ← Exports CSV/Excel (outil 5)
    └── export_20250503_1430/
        ├── produits_*.csv
        └── ...
```
