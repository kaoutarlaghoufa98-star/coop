#!/usr/bin/env python3
# COOP TAFERNOUT - Verificateur d'alertes stock

import json
import os
import sys
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


def find_data_file():
    env_path = os.getenv('TAFERNOUT_DATA_FILE')
    if env_path:
        return env_path

    local_path = os.path.join(os.path.dirname(__file__), '..', 'tafernout_data.json')
    if os.path.exists(local_path):
        return local_path

    appdata = os.getenv('APPDATA')
    if appdata:
        fallback_path = os.path.join(appdata, 'coop-tafernout', 'tafernout_data.json')
        if os.path.exists(fallback_path):
            return fallback_path

    return local_path


DATA_FILE = find_data_file()
OUTPUT_FILE = os.getenv('TAFERNOUT_OUTPUT_FILE') or os.path.join(os.path.dirname(__file__), '..', 'alertes_stock.txt')


class C:
    ROUGE = '\033[91m'
    ORANGE = '\033[93m'
    VERT = '\033[92m'
    GRAS = '\033[1m'
    RESET = '\033[0m'


def rouge(text):
    return f"{C.ROUGE}{C.GRAS}{text}{C.RESET}"


def orange(text):
    return f"{C.ORANGE}{text}{C.RESET}"


def vert(text):
    return f"{C.VERT}{text}{C.RESET}"


def gras(text):
    return f"{C.GRAS}{text}{C.RESET}"


def load_data(path):
    if not os.path.exists(path):
        print(rouge(f"[ERREUR] Fichier introuvable : {path}"))
        print("    Lancez d'abord l'application pour creer le fichier de donnees.")
        sys.exit(1)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def analyser_matieres(matieres):
    ruptures = [m for m in matieres if m.get('currentStock', 0) <= 0]
    critiques = [m for m in matieres if 0 < m.get('currentStock', 0) <= m.get('minStock', 0)]
    ok = [m for m in matieres if m.get('currentStock', 0) > m.get('minStock', 0)]
    return ruptures, critiques, ok


def analyser_produits(produits):
    ruptures = [p for p in produits if p.get('stock', 0) <= 0]
    critiques = [p for p in produits if 0 < p.get('stock', 0) <= p.get('minStock', 0)]
    ok = [p for p in produits if p.get('stock', 0) > p.get('minStock', 0)]
    return ruptures, critiques, ok


def suggerer_commandes(matieres):
    suggestions = []
    for m in matieres:
        current_stock = m.get('currentStock', 0)
        min_stock = m.get('minStock', 0)
        if current_stock <= min_stock:
            qte_cible = min_stock * 2
            qte_a_commander = max(0, qte_cible - current_stock)
            if qte_a_commander > 0:
                suggestions.append({
                    'name': m.get('name', 'Matiere'),
                    'unit': m.get('unit', ''),
                    'actuel': current_stock,
                    'minimum': min_stock,
                    'a_commander': qte_a_commander,
                    'cible': qte_cible,
                    'supplier': m.get('supplier', '-'),
                })
    return sorted(suggestions, key=lambda x: x['actuel'] / max(x['minimum'], 1))


def afficher_rapport(data, mat_r, mat_c, mat_ok, prod_r, prod_c, suggestions):
    nom = data.get('appSettings', {}).get('name', 'Coop Tafernout')
    now = datetime.now().strftime('%d/%m/%Y %H:%M')

    print("\n" + "=" * 60)
    print(gras(f"  {nom.upper()} - RAPPORT ALERTES STOCK"))
    print(f"  Date: {now}")
    print("=" * 60)

    print(gras("\n  MATIERES PREMIERES"))
    print("  " + "-" * 56)

    if mat_r:
        print(rouge(f"\n  RUPTURES ({len(mat_r)}) - Commander immediatement"))
        for m in mat_r:
            print(rouge(f"     - {m.get('name', 'Matiere'):<25} Stock: {m.get('currentStock', 0)} {m.get('unit', ''):<8} Min: {m.get('minStock', 0)} {m.get('unit', '')}"))

    if mat_c:
        print(orange(f"\n  STOCK FAIBLE ({len(mat_c)}) - Commander rapidement"))
        for m in mat_c:
            min_stock = m.get('minStock', 0)
            current_stock = m.get('currentStock', 0)
            pct = round(current_stock / min_stock * 100) if min_stock else 100
            barre = '#' * int(pct / 10) + '.' * (10 - int(pct / 10))
            print(orange(f"     - {m.get('name', 'Matiere'):<25} [{barre}] {pct:3d}%  ({current_stock}/{min_stock} {m.get('unit', '')})"))

    if mat_ok:
        print(vert(f"\n  STOCK SUFFISANT ({len(mat_ok)})"))
        for m in mat_ok:
            print(vert(f"     - {m.get('name', 'Matiere'):<25} {m.get('currentStock', 0)} {m.get('unit', '')}"))

    print(gras("\n  PRODUITS FINIS"))
    print("  " + "-" * 56)

    if prod_r:
        print(rouge(f"\n  RUPTURES ({len(prod_r)}) - A produire en urgence"))
        for p in prod_r:
            print(rouge(f"     - {p.get('name', 'Produit'):<30} Stock: 0  (min: {p.get('minStock', 0)})"))

    if prod_c:
        print(orange(f"\n  STOCK FAIBLE ({len(prod_c)}) - A produire bientot"))
        for p in prod_c:
            print(orange(f"     - {p.get('name', 'Produit'):<30} Stock: {p.get('stock', 0)} (min: {p.get('minStock', 0)})"))

    prod_ok = [p for p in data.get('products', []) if p.get('stock', 0) > p.get('minStock', 0)]
    if prod_ok:
        print(vert(f"\n  PRODUITS OK ({len(prod_ok)})"))

    if suggestions:
        print(gras("\n  LISTE DE COMMANDES FOURNISSEURS SUGGEREES"))
        print("  " + "-" * 56)
        print(f"  {'Matiere':<25} {'Fournisseur':<20} {'Qte a cmd':<12} {'Actuel->Cible'}")
        print("  " + "-" * 56)
        for s in suggestions:
            indicateur = 'RUPTURE' if s['actuel'] <= 0 else 'ALERTE '
            print(f"  {indicateur:<8} {s['name']:<23} {s['supplier']:<20} {s['a_commander']} {s['unit']:<8} {s['actuel']} -> {s['cible']} {s['unit']}")

    total_alertes = len(mat_r) + len(mat_c) + len(prod_r) + len(prod_c)
    print("\n" + "=" * 60)
    if total_alertes == 0:
        print(vert(gras("  Aucune alerte - Tous les stocks sont OK !")))
    else:
        print(rouge(gras(f"  {total_alertes} alerte(s) au total")))
        print(f"     - Ruptures matieres : {len(mat_r)}")
        print(f"     - Stocks faibles    : {len(mat_c)}")
        print(f"     - Ruptures produits : {len(prod_r)}")
        print(f"     - Produits faibles  : {len(prod_c)}")
    print("=" * 60 + "\n")


def exporter_txt(data, mat_r, mat_c, suggestions, output):
    nom = data.get('appSettings', {}).get('name', 'Coop Tafernout')
    now = datetime.now().strftime('%d/%m/%Y %H:%M')
    lignes = [
        '=' * 60,
        f"  {nom.upper()} - RAPPORT ALERTES STOCK",
        f"  Genere le {now}",
        '=' * 60,
        '',
    ]

    if mat_r:
        lignes.append('RUPTURES DE STOCK')
        for m in mat_r:
            lignes.append(f"   - {m.get('name', 'Matiere')} - RUPTURE ({m.get('supplier', '-')})")
        lignes.append('')

    if mat_c:
        lignes.append('STOCKS FAIBLES')
        for m in mat_c:
            lignes.append(f"   - {m.get('name', 'Matiere')} - {m.get('currentStock', 0)}/{m.get('minStock', 0)} {m.get('unit', '')} ({m.get('supplier', '-')})")
        lignes.append('')

    if suggestions:
        lignes.append('COMMANDES A PASSER')
        for s in suggestions:
            lignes.append(f"   - {s['name']:<25} {s['a_commander']} {s['unit']:<6} chez {s['supplier']}")
        lignes.append('')

    lignes.append('=' * 60)

    os.makedirs(os.path.dirname(output), exist_ok=True)
    with open(output, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lignes))
    print(f"[OK] Rapport exporte : {output}\n")


def main():
    data = load_data(DATA_FILE)
    matieres = data.get('rawMaterials', [])
    produits = data.get('products', [])

    mat_r, mat_c, mat_ok = analyser_matieres(matieres)
    prod_r, prod_c, _prod_ok = analyser_produits(produits)
    suggestions = suggerer_commandes(matieres)

    afficher_rapport(data, mat_r, mat_c, mat_ok, prod_r, prod_c, suggestions)
    exporter_txt(data, mat_r, mat_c, suggestions, OUTPUT_FILE)


if __name__ == '__main__':
    main()
