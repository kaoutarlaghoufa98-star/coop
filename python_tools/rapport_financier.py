#!/usr/bin/env python3
# ════════════════════════════════════════════════
# COOP TAFERNOUT — Générateur de rapport financier
# Lit le fichier JSON de données et génère un
# rapport financier mensuel en HTML imprimable.
# ════════════════════════════════════════════════

import json
import os
import sys
from datetime import datetime

# Forcer l'encodage UTF-8 dans la sortie console sur Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


# ── Configuration ─────────────────────────────────────────────────────────────

def find_data_file():
    env_path = os.getenv('TAFERNOUT_DATA_FILE')
    if env_path:
        return env_path

    # Cherche d'abord le fichier de données dans le projet local
    local_path = os.path.join(os.path.dirname(__file__), '..', 'tafernout_data.json')
    if os.path.exists(local_path):
        return local_path

    # Si l'application Electron a déjà sauvé les données dans AppData, utilise ce fichier
    appdata = os.getenv('APPDATA')
    if appdata:
        fallback_path = os.path.join(appdata, 'coop-tafernout', 'tafernout_data.json')
        if os.path.exists(fallback_path):
            return fallback_path

    return local_path

DATA_FILE   = find_data_file()
OUTPUT_FILE = os.getenv('TAFERNOUT_OUTPUT_FILE') or os.path.join(os.path.dirname(__file__), '..', 'rapport_financier.html')


# ── Chargement des données ─────────────────────────────────────────────────────

def load_data(path):
    if not os.path.exists(path):
        print(f"❌  Fichier introuvable : {path}")
        print("    Assurez-vous que l'application a été lancée au moins une fois.")
        sys.exit(1)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ── Calculs financiers ─────────────────────────────────────────────────────────

def calculer_stats(data):
    ventes      = data.get('sales', [])
    charges     = data.get('charges', [])
    clients     = data.get('clients', [])
    produits    = data.get('products', [])
    employes    = data.get('employees', [])

    total_ventes    = sum(v.get('total', 0) for v in ventes)
    total_charges   = sum(c.get('amount', 0) for c in charges)
    total_pertes    = sum(c.get('amount', 0) for c in charges if c.get('type') == 'perte')
    total_creances  = sum(cl.get('credit', 0) for cl in clients)
    benefice_net    = total_ventes - total_charges
    masse_salariale = sum(e.get('salary', 0) for e in employes if e.get('status') == 'actif')

    # Répartition ventes par catégorie
    cat_ventes = {}
    for v in ventes:
        for item in v.get('items', []):
            prod = next((p for p in produits if p.get('id') == item.get('productId')), None)
            cat  = prod.get('category', 'Autre') if prod else 'Autre'
            cat_ventes[cat] = cat_ventes.get(cat, 0) + item.get('qty', 0) * item.get('price', 0)

    # Répartition charges par catégorie
    cat_charges = {}
    for c in charges:
        cat = c.get('category', 'Autre')
        cat_charges[cat] = cat_charges.get(cat, 0) + c.get('amount', 0)

    # Top 5 produits vendus (par quantité)
    prod_qty = {}
    for v in ventes:
        for item in v.get('items', []):
            name = item.get('name', 'Produit')
            prod_qty[name] = prod_qty.get(name, 0) + item.get('qty', 0)
    top_produits = sorted(prod_qty.items(), key=lambda x: x[1], reverse=True)[:5]

    # Clients débiteurs triés
    debiteurs = sorted(
        [cl for cl in clients if cl.get('credit', 0) > 0],
        key=lambda x: x.get('credit', 0), reverse=True
    )

    return {
        'total_ventes':    total_ventes,
        'total_charges':   total_charges,
        'total_pertes':    total_pertes,
        'total_creances':  total_creances,
        'benefice_net':    benefice_net,
        'masse_salariale': masse_salariale,
        'taux_marge':      round(benefice_net / total_ventes * 100, 1) if total_ventes else 0,
        'nb_ventes':       len(ventes),
        'nb_creances':     len([v for v in ventes if v.get('status') == 'créance']),
        'cat_ventes':      dict(sorted(cat_ventes.items(), key=lambda x: x[1], reverse=True)),
        'cat_charges':     dict(sorted(cat_charges.items(), key=lambda x: x[1], reverse=True)),
        'top_produits':    top_produits,
        'debiteurs':       debiteurs,
    }


# ── Génération HTML ────────────────────────────────────────────────────────────

def fmt_mad(n):
    return f"{n:,.0f} MAD".replace(',', ' ')

def color_stat(val, neutral=False):
    if neutral: return '#5C3317'
    return '#2E7D32' if val >= 0 else '#C62828'

def build_html(data, stats):
    s    = data.get('appSettings', {})
    nom  = s.get('name', 'Coop Tafernout')
    now  = datetime.now().strftime('%d/%m/%Y à %H:%M')
    mois = datetime.now().strftime('%B %Y').capitalize()

    # Barres catégories ventes
    max_ventes = max(stats['cat_ventes'].values(), default=1)
    barres_ventes = ''.join([
        f"""<tr>
          <td style="width:140px;font-weight:500">{cat}</td>
          <td style="padding:4px 12px">
            <div style="background:#E8C9A8;border-radius:4px;height:16px">
              <div style="background:#7A4520;height:16px;border-radius:4px;width:{round(val/max_ventes*100)}%"></div>
            </div>
          </td>
          <td style="text-align:right;font-weight:700;color:#5C3317;white-space:nowrap">{fmt_mad(val)}</td>
        </tr>"""
        for cat, val in stats['cat_ventes'].items()
    ])

    # Barres catégories charges
    max_charges = max(stats['cat_charges'].values(), default=1)
    barres_charges = ''.join([
        f"""<tr>
          <td style="width:160px;font-weight:500">{cat}</td>
          <td style="padding:4px 12px">
            <div style="background:#E8C9A8;border-radius:4px;height:16px">
              <div style="background:#C62828;height:16px;border-radius:4px;width:{round(val/max_charges*100)}%"></div>
            </div>
          </td>
          <td style="text-align:right;font-weight:700;color:#C62828;white-space:nowrap">{fmt_mad(val)}</td>
        </tr>"""
        for cat, val in stats['cat_charges'].items()
    ])

    # Top produits
    lignes_top = ''.join([
        f"""<tr>
          <td>{i+1}</td>
          <td style="font-weight:600">🎂 {nom_p}</td>
          <td style="text-align:center;font-weight:700;color:#5C3317">{qty}</td>
        </tr>"""
        for i, (nom_p, qty) in enumerate(stats['top_produits'])
    ])

    # Débiteurs
    lignes_dbt = ''.join([
        f"""<tr>
          <td>👤 {cl['name']}</td>
          <td>{cl.get('phone','—')}</td>
          <td style="text-align:right;font-weight:700;color:#C62828">{fmt_mad(cl['credit'])}</td>
        </tr>"""
        for cl in stats['debiteurs']
    ]) or '<tr><td colspan="3" style="text-align:center;color:green">✅ Aucune créance</td></tr>'

    couleur_bn = color_stat(stats['benefice_net'])

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Financier — {nom}</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0 }}
  body {{ font-family:Georgia,serif; color:#1A0E08; background:#FBF6F1; padding:2rem; max-width:900px; margin:0 auto }}
  h1   {{ font-size:1.6rem; letter-spacing:2px; text-transform:uppercase; color:#5C3317 }}
  h2   {{ font-size:1rem; color:#7A4520; margin:1.5rem 0 0.8rem; border-bottom:2px solid #E8C9A8; padding-bottom:6px }}
  .hd  {{ text-align:center; padding:1.5rem 0; border-bottom:2px solid #C9952A; margin-bottom:1.5rem }}
  .sub {{ color:#9B7B6A; font-size:0.85rem; margin-top:4px }}
  .grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin:1rem 0 }}
  .kpi  {{ background:white; border-radius:10px; padding:1rem; border-left:4px solid #C9952A; box-shadow:0 1px 4px rgba(0,0,0,.08) }}
  .kpi .label {{ font-size:0.72rem; color:#9B7B6A; text-transform:uppercase; letter-spacing:.6px }}
  .kpi .value {{ font-size:1.25rem; font-weight:700; margin:4px 0 2px }}
  .card {{ background:white; border-radius:10px; padding:1.2rem; margin-bottom:1rem; box-shadow:0 1px 4px rgba(0,0,0,.08) }}
  table {{ width:100%; border-collapse:collapse; font-size:0.87rem }}
  th,td {{ padding:8px 10px; border-bottom:1px solid #F0E0CC; text-align:left }}
  th {{ background:#FBF6F1; font-size:0.72rem; text-transform:uppercase; color:#9B7B6A; letter-spacing:.5px }}
  .ft {{ margin-top:2rem; text-align:center; font-size:0.75rem; color:#9B7B6A; border-top:1px solid #E8C9A8; padding-top:1rem }}
  @media print {{ body{{ background:white; padding:1rem }} }}
</style>
</head>
<body>

<div class="hd">
  <div style="font-size:3rem">🥐</div>
  <h1>{nom}</h1>
  <div class="sub">Rapport Financier — {mois}</div>
  <div class="sub">Généré le {now}</div>
</div>

<h2>📊 Indicateurs clés</h2>
<div class="grid">
  <div class="kpi">
    <div class="label">💰 Ventes totales</div>
    <div class="value" style="color:#2E7D32">{fmt_mad(stats['total_ventes'])}</div>
    <div class="sub">{stats['nb_ventes']} transactions</div>
  </div>
  <div class="kpi">
    <div class="label">💸 Charges & Pertes</div>
    <div class="value" style="color:#C62828">{fmt_mad(stats['total_charges'])}</div>
    <div class="sub">dont {fmt_mad(stats['total_pertes'])} pertes</div>
  </div>
  <div class="kpi">
    <div class="label">📈 Bénéfice net</div>
    <div class="value" style="color:{couleur_bn}">{fmt_mad(stats['benefice_net'])}</div>
    <div class="sub">Marge : {stats['taux_marge']}%</div>
  </div>
  <div class="kpi">
    <div class="label">🧾 Créances clients</div>
    <div class="value" style="color:#E65100">{fmt_mad(stats['total_creances'])}</div>
    <div class="sub">{stats['nb_creances']} vente(s) impayée(s)</div>
  </div>
  <div class="kpi">
    <div class="label">👥 Masse salariale</div>
    <div class="value" style="color:#5C3317">{fmt_mad(stats['masse_salariale'])}</div>
    <div class="sub">Employés actifs</div>
  </div>
  <div class="kpi">
    <div class="label">💹 Résultat net</div>
    <div class="value" style="color:{color_stat(stats['benefice_net'] - stats['masse_salariale'])}">
      {fmt_mad(stats['benefice_net'] - stats['masse_salariale'])}
    </div>
    <div class="sub">Après salaires</div>
  </div>
</div>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
  <div class="card">
    <h2 style="margin-top:0">🎂 Ventes par catégorie</h2>
    <table><tbody>{barres_ventes}</tbody></table>
  </div>
  <div class="card">
    <h2 style="margin-top:0">💸 Charges par catégorie</h2>
    <table><tbody>{barres_charges}</tbody></table>
  </div>
</div>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
  <div class="card">
    <h2 style="margin-top:0">🏆 Top 5 produits vendus</h2>
    <table>
      <thead><tr><th>#</th><th>Produit</th><th>Qté vendue</th></tr></thead>
      <tbody>{lignes_top}</tbody>
    </table>
  </div>
  <div class="card">
    <h2 style="margin-top:0">⚠️ Clients débiteurs</h2>
    <table>
      <thead><tr><th>Client</th><th>Téléphone</th><th style="text-align:right">Montant dû</th></tr></thead>
      <tbody>{lignes_dbt}</tbody>
    </table>
  </div>
</div>

<div class="ft">🎂 {nom} — Rapport généré automatiquement par l'outil Python</div>
</body>
</html>"""


# ── Point d'entrée ─────────────────────────────────────────────────────────────

def main():
    print("\n🚀 Génération du rapport financier...")

    data  = load_data(DATA_FILE)
    stats = calculer_stats(data)

    # Résumé console
    print("\n" + "═"*50)
    print(f"  📊 RAPPORT FINANCIER — {data.get('appSettings',{}).get('name','Coop Tafernout')}")
    print("═"*50)
    print(f"  💰 Ventes totales   : {fmt_mad(stats['total_ventes'])}")
    print(f"  💸 Charges & Pertes : {fmt_mad(stats['total_charges'])}")
    benefice = stats['benefice_net']
    signe = "✅" if benefice >= 0 else "❌"
    print(f"  {signe} Bénéfice net    : {fmt_mad(benefice)} ({stats['taux_marge']}%)")
    print(f"  🧾 Créances clients : {fmt_mad(stats['total_creances'])}")
    print(f"  👤 Top produit      : {stats['top_produits'][0][0] if stats['top_produits'] else '—'}")
    print("═"*50)

    # Écriture HTML
    html = build_html(data, stats)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\n✅ Rapport généré : {OUTPUT_FILE}")
    print("   Ouvrez ce fichier dans votre navigateur pour l'imprimer.\n")


if __name__ == '__main__':
    main()
