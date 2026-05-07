import json
import os
from datetime import datetime

# ============================================================
# CONFIGURATION — Modifiez ces valeurs selon vos besoins
# ============================================================

APP_NAME = "Coop Tafernout"
APP_VILLE = "Marrakech"

PRODUITS = [
    {"name": "Mille-feuille",    "category": "Feuilletés",    "price": 18, "cost": 7,  "stock": 24, "minStock": 10},
    {"name": "Tarte Citron",     "category": "Tartes",        "price": 22, "cost": 9,  "stock": 8,  "minStock": 12},
    {"name": "Éclair Chocolat",  "category": "Choux",         "price": 15, "cost": 5,  "stock": 30, "minStock": 15},
    {"name": "Paris-Brest",      "category": "Choux",         "price": 25, "cost": 10, "stock": 5,  "minStock": 8},
    {"name": "Macaron Assortis", "category": "Macarons",      "price": 35, "cost": 14, "stock": 40, "minStock": 20},
    {"name": "Baklava",          "category": "Orientaux",     "price": 28, "cost": 11, "stock": 15, "minStock": 10},
    {"name": "Chebakia",         "category": "Orientaux",     "price": 20, "cost": 8,  "stock": 20, "minStock": 10},
    {"name": "Croissant",        "category": "Viennoiseries", "price": 8,  "cost": 3,  "stock": 35, "minStock": 20},
]

CLIENTS = [
    {"name": "Sofia Alami",     "phone": "0661234567", "credit": 0,    "notes": "Cliente fidèle"},
    {"name": "Mohammed Fassi",  "phone": "0662345678", "credit": 250,  "notes": "Commandes hebdomadaires"},
    {"name": "Café Atlas",      "phone": "0664567890", "credit": 580,  "notes": "Commandes traiteur"},
    {"name": "Hôtel Palais",    "phone": "0665678901", "credit": 1200, "notes": "Grands événements"},
]

EMPLOYES = [
    {"name": "Fatima Zahra Idrissi", "role": "Directrice",  "salary": 4500, "dailySalary": 150, "phone": "0661111111", "startDate": "2020-01-01", "status": "actif", "cin": "AB123456", "adresse": "Marrakech"},
    {"name": "Khadija Benali",       "role": "Vendeuse",    "salary": 3200, "dailySalary": 107, "phone": "0662222222", "startDate": "2021-03-15", "status": "actif", "cin": "CD234567", "adresse": "Marrakech"},
    {"name": "Hassan Tazi",          "role": "Pâtissier",   "salary": 4000, "dailySalary": 133, "phone": "0663333333", "startDate": "2020-06-01", "status": "actif", "cin": "EF345678", "adresse": "Marrakech"},
    {"name": "Aicha Ouali",          "role": "Apprentie",   "salary": 2200, "dailySalary": 73,  "phone": "0664444444", "startDate": "2023-09-01", "status": "actif", "cin": "GH456789", "adresse": "Marrakech"},
    {"name": "Rachid Lamrani",       "role": "Livreur",     "salary": 2800, "dailySalary": 93,  "phone": "0665555555", "startDate": "2022-01-10", "status": "actif", "cin": "IJ567890", "adresse": "Marrakech"},
]

MATIERES = [
    {"name": "Farine",              "unit": "kg",     "currentStock": 50,  "minStock": 20,  "supplier": "Moulin Atlas"},
    {"name": "Beurre",              "unit": "kg",     "currentStock": 8,   "minStock": 10,  "supplier": "Laiterie Maroc"},
    {"name": "Sucre",               "unit": "kg",     "currentStock": 35,  "minStock": 15,  "supplier": "Cosumar"},
    {"name": "Œufs",                "unit": "unités", "currentStock": 240, "minStock": 100, "supplier": "Ferme Bio"},
    {"name": "Lait",                "unit": "litres", "currentStock": 20,  "minStock": 10,  "supplier": "Centrale Laitière"},
    {"name": "Chocolat couverture", "unit": "kg",     "currentStock": 5,   "minStock": 8,   "supplier": "Barry Callebaut"},
    {"name": "Amandes",             "unit": "kg",     "currentStock": 12,  "minStock": 5,   "supplier": "Oléagineux du Maroc"},
]

CHARGES = [
    {"label": "Loyer mensuel",    "category": "Loyer",            "type": "charge", "amount": 4500,  "supplier": "Propriétaire",  "paid": True},
    {"label": "Farine 100kg",     "category": "Matières premières","type": "charge", "amount": 850,   "supplier": "Moulin Atlas",   "paid": True},
    {"label": "Électricité",      "category": "Énergie",          "type": "charge", "amount": 380,   "supplier": "RADEEMA",        "paid": False},
    {"label": "Emballages",       "category": "Emballages",       "type": "charge", "amount": 250,   "supplier": "PackMaroc",      "paid": True},
    {"label": "Produits périmés", "category": "Pertes",           "type": "perte",  "amount": 320,   "supplier": "",               "paid": True},
]

# ============================================================
# GÉNÉRATION AUTOMATIQUE DES DONNÉES
# ============================================================

def generate_id(index):
    return index + 1

def today():
    return datetime.now().strftime("%Y-%m-%d")

def build_data():
    data = {}

    # UTILISATEURS
    data["users"] = [
        {
            "id": 1,
            "name": "Fatima Zahra",
            "username": "admin",
            "password": "admin123",
            "role": "Directrice",
            "permissions": {
                "dashboard": True, "pos": True, "products": True,
                "clients": True, "stock": True, "charges": True,
                "invoices": True, "personnel": True, "users": True,
                "orders": True, "settings": True
            }
        },
        {
            "id": 2,
            "name": "Khadija Benali",
            "username": "khadija",
            "password": "pass123",
            "role": "Vendeuse",
            "permissions": {
                "dashboard": True, "pos": True, "products": False,
                "clients": True, "stock": False, "charges": False,
                "invoices": True, "personnel": False, "users": False,
                "orders": True, "settings": False
            }
        }
    ]

    # PRODUITS
    data["products"] = [
        {
            "id": generate_id(i),
            "name": p["name"],
            "category": p["category"],
            "price": p["price"],
            "cost": p["cost"],
            "stock": p["stock"],
            "minStock": p["minStock"],
            "image": "",
            "marge": round((p["price"] - p["cost"]) / p["price"] * 100)
        }
        for i, p in enumerate(PRODUITS)
    ]

    # CLIENTS
    data["clients"] = [
        {
            "id": generate_id(i),
            "name": c["name"],
            "phone": c["phone"],
            "credit": c["credit"],
            "notes": c["notes"]
        }
        for i, c in enumerate(CLIENTS)
    ]

    # EMPLOYÉS
    data["employees"] = [
        {
            "id": generate_id(i),
            "name": e["name"],
            "role": e["role"],
            "salary": e["salary"],
            "dailySalary": e["dailySalary"],
            "phone": e["phone"],
            "startDate": e["startDate"],
            "status": e["status"],
            "cin": e["cin"],
            "adresse": e["adresse"]
        }
        for i, e in enumerate(EMPLOYES)
    ]

    # MATIÈRES PREMIÈRES
    data["rawMaterials"] = [
        {
            "id": generate_id(i),
            "name": m["name"],
            "unit": m["unit"],
            "currentStock": m["currentStock"],
            "minStock": m["minStock"],
            "supplier": m["supplier"],
            "lastUpdated": today()
        }
        for i, m in enumerate(MATIERES)
    ]

    # CHARGES & PERTES
    data["charges"] = [
        {
            "id": generate_id(i),
            "date": today(),
            "label": c["label"],
            "category": c["category"],
            "type": c["type"],
            "amount": c["amount"],
            "supplier": c["supplier"],
            "paid": c["paid"]
        }
        for i, c in enumerate(CHARGES)
    ]

    # VENTES EXEMPLES
    data["sales"] = []

    # COMMANDES EXEMPLES
    data["orders"] = []

    # MOUVEMENTS STOCK
    data["stockMovements"] = []

    # PARAMÈTRES
    data["settings"] = {
        "appName": APP_NAME,
        "logoUrl": "",
        "theme": "brown"
    }

    return data

# ============================================================
# INJECTION DANS LE FICHIER HTML
# ============================================================

def inject_into_html(data):
    html_file = "index.html"

    if not os.path.exists(html_file):
        print(f"❌ Fichier {html_file} introuvable !")
        return

    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    json_data = json.dumps(data, ensure_ascii=False, indent=2)

    # Remplace la clé localStorage pour forcer le rechargement
    new_storage_key = f"tafernout_v5"

    # Génère le bloc JS à injecter
    injection = f"""
// ========== DONNÉES GÉNÉRÉES PAR PYTHON — {today()} ==========
const PYTHON_DATA = {json_data};
"""

    # Cherche le marqueur dans le HTML et injecte après
    marker = "const {useState,useEffect,useRef,useCallback}=React;"
    if marker in content:
        content = content.replace(marker, marker + "\n" + injection)
        print("✅ Données injectées dans index.html")
    else:
        print("⚠️  Marqueur non trouvé — vérifiez le fichier HTML")
        return

    # Remplace INITIAL_DATA par PYTHON_DATA dans useStore
    content = content.replace(
        "try{const s=localStorage.getItem('tafernout_v5');return s?JSON.parse(s):{...INITIAL_DATA};}",
        "try{const s=localStorage.getItem('tafernout_v5');return s?JSON.parse(s):{...PYTHON_DATA};}",
    )
    content = content.replace(
        "catch{return {...INITIAL_DATA};}",
        "catch{return {...PYTHON_DATA};}",
    )

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Fichier {html_file} mis à jour avec succès !")

# ============================================================
# RAPPORT CONSOLE
# ============================================================

def print_report(data):
    print("\n" + "="*50)
    print(f"  📊 RAPPORT — {APP_NAME}")
    print("="*50)
    print(f"  🎂 Produits       : {len(data['products'])}")
    print(f"  👥 Clients        : {len(data['clients'])}")
    print(f"  👤 Employés       : {len(data['employees'])}")
    print(f"  📦 Matières       : {len(data['rawMaterials'])}")
    print(f"  💸 Charges/Pertes : {len(data['charges'])}")
    total_salaires = sum(e['salary'] for e in data['employees'])
    print(f"  💰 Masse salariale: {total_salaires:,} MAD/mois")
    stock_alert = [m for m in data['rawMaterials'] if m['currentStock'] <= m['minStock']]
    print(f"  ⚠️  Alertes stock  : {len(stock_alert)}")
    print("="*50)
    print(f"  ✅ Généré le {today()}")
    print("="*50 + "\n")

# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":
    print("\n🚀 Génération des données en cours...")
    data = build_data()
    print_report(data)
    inject_into_html(data)
    print("\n🎉 Terminé ! Lancez npm start pour voir l'application.\n")