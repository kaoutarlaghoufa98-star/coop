#!/usr/bin/env python3
# ════════════════════════════════════════════════
# COOP TAFERNOUT — Générateur de fiches de paie
# Génère les fiches de paie mensuelles de tous
# les employés actifs au format HTML imprimable.
# ════════════════════════════════════════════════

import json
import os
import sys
from datetime import datetime


# ── Configuration ─────────────────────────────────────────────────────────────

DATA_FILE  = os.path.join(os.path.dirname(__file__), '..', 'tafernout_data.json')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'fiches_paie')


# ── Chargement des données ─────────────────────────────────────────────────────

def load_data(path):
    if not os.path.exists(path):
        print(f"❌  Fichier introuvable : {path}")
        print("    Lancez d'abord l'application pour créer le fichier de données.")
        sys.exit(1)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ── Calcul des cotisations ─────────────────────────────────────────────────────

def calculer_paie(employe):
    """
    Calcul simplifié inspiré du barème CNSS Maroc :
      - CNSS salarié  :  4.48% (brut plafonné 6000 MAD)
      - AMO salarié   :  2.26%
      - IR (simplifié):  tranche progressive approximative
    """
    salaire_brut = employe.get('salary', 0)
    jours        = employe.get('workDays', 25)
    taux_jour    = employe.get('dailyRate', round(salaire_brut / 26))

    # Cotisations salariales
    cnss_plafond  = min(salaire_brut, 6000)
    cnss          = round(cnss_plafond * 0.0448, 2)
    amo           = round(salaire_brut * 0.0226, 2)
    total_cot     = cnss + amo

    # IR approximatif (tranches simplifiées, mensuel)
    revenu_imposable = salaire_brut - total_cot
    if   revenu_imposable <= 2500:  ir = 0
    elif revenu_imposable <= 4166:  ir = round((revenu_imposable - 2500) * 0.10, 2)
    elif revenu_imposable <= 5000:  ir = round(166.6 + (revenu_imposable - 4166) * 0.20, 2)
    elif revenu_imposable <= 6666:  ir = round(333.4 + (revenu_imposable - 5000) * 0.30, 2)
    else:                           ir = round(833.2 + (revenu_imposable - 6666) * 0.34, 2)

    net = round(salaire_brut - cnss - amo - ir, 2)

    return {
        'brut':       salaire_brut,
        'jours':      jours,
        'taux_jour':  taux_jour,
        'cnss':       cnss,
        'amo':        amo,
        'ir':         ir,
        'total_ret':  round(cnss + amo + ir, 2),
        'net':        net,
    }


# ── Génération d'une fiche de paie HTML ───────────────────────────────────────

def fmt(n): return f"{n:,.2f} MAD".replace(',', ' ')

def build_fiche_html(emp, paie, settings, mois_label):
    nom_app  = settings.get('name', 'Coop Tafernout')
    ville    = settings.get('ville', 'Marrakech')
    adresse  = settings.get('adresse', '')
    tel      = settings.get('tel', '')
    now      = datetime.now().strftime('%d/%m/%Y')

    anciennete = ''
    if emp.get('startDate'):
        try:
            debut = datetime.strptime(emp['startDate'], '%Y-%m-%d')
            delta = datetime.now() - debut
            ans   = delta.days // 365
            mois  = (delta.days % 365) // 30
            anciennete = f"{ans} an(s) {mois} mois"
        except Exception:
            anciennete = emp.get('startDate', '')

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Fiche de Paie — {emp['name']}</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0 }}
  body {{ font-family:'Helvetica Neue',Arial,sans-serif; color:#1A0E08; background:white; padding:2rem; max-width:720px; margin:0 auto; font-size:0.88rem }}
  .hd {{ display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:1rem; border-bottom:3px solid #5C3317; margin-bottom:1.2rem }}
  .logo {{ font-size:2.5rem }}
  .nom-app {{ font-size:1.3rem; font-weight:700; color:#5C3317; letter-spacing:1px }}
  .sous-titre {{ font-size:0.75rem; color:#9B7B6A }}
  .titre-fiche {{ font-size:1.1rem; font-weight:700; color:#5C3317; text-align:right }}
  .mois {{ font-size:0.85rem; color:#7A4520; text-align:right }}
  .bloc {{ background:#FBF6F1; border-radius:8px; padding:1rem; margin-bottom:1rem; border:1px solid #E8C9A8 }}
  .bloc h3 {{ font-size:0.75rem; text-transform:uppercase; letter-spacing:.8px; color:#9B7B6A; margin-bottom:0.6rem; padding-bottom:4px; border-bottom:1px solid #E8C9A8 }}
  .row {{ display:flex; justify-content:space-between; padding:4px 0; font-size:0.86rem }}
  .row .lbl {{ color:#5C3317 }}
  .row .val {{ font-weight:600 }}
  table {{ width:100%; border-collapse:collapse; font-size:0.86rem }}
  th {{ background:#5C3317; color:white; padding:8px 10px; text-align:left; font-size:0.75rem; text-transform:uppercase; letter-spacing:.5px }}
  td {{ padding:8px 10px; border-bottom:1px solid #E8C9A8 }}
  .total-row td {{ background:#FBF6F1; font-weight:700; color:#5C3317 }}
  .net-row td {{ background:#5C3317; color:white; font-weight:700; font-size:1.05rem }}
  .ft {{ margin-top:1.5rem; font-size:0.72rem; color:#9B7B6A; border-top:1px solid #E8C9A8; padding-top:0.8rem; display:flex; justify-content:space-between }}
  .signature {{ display:flex; justify-content:space-between; margin-top:2rem }}
  .sig-bloc {{ text-align:center; width:45% }}
  .sig-ligne {{ border-top:1px solid #9B7B6A; margin-top:3rem; padding-top:6px; font-size:0.75rem; color:#9B7B6A }}
  @media print {{ body{{ padding:1rem }} }}
</style>
</head>
<body>

<div class="hd">
  <div>
    <div class="logo">🥐</div>
    <div class="nom-app">{nom_app}</div>
    <div class="sous-titre">Pâtisserie Coopérative · {ville}</div>
    {f'<div class="sous-titre">{adresse}</div>' if adresse else ''}
    {f'<div class="sous-titre">☎ {tel}</div>' if tel else ''}
  </div>
  <div>
    <div class="titre-fiche">BULLETIN DE PAIE</div>
    <div class="mois">{mois_label}</div>
    <div class="sous-titre" style="text-align:right;margin-top:4px">Édité le {now}</div>
  </div>
</div>

<div class="bloc">
  <h3>👤 Informations employé</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.3rem">
    <div class="row"><span class="lbl">Nom complet</span><span class="val">{emp['name']}</span></div>
    <div class="row"><span class="lbl">Poste</span><span class="val">{emp.get('role','—')}</span></div>
    <div class="row"><span class="lbl">Téléphone</span><span class="val">{emp.get('phone','—')}</span></div>
    <div class="row"><span class="lbl">Ancienneté</span><span class="val">{anciennete or '—'}</span></div>
    <div class="row"><span class="lbl">Statut</span><span class="val">{emp.get('status','actif').capitalize()}</span></div>
    <div class="row"><span class="lbl">Jours travaillés</span><span class="val">{paie['jours']} jours</span></div>
  </div>
</div>

<table>
  <thead>
    <tr><th>Libellé</th><th style="text-align:right">Base</th><th style="text-align:right">Taux</th><th style="text-align:right">Montant</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Salaire de base</strong></td>
      <td style="text-align:right">{paie['jours']} j × {paie['taux_jour']:,.0f} MAD</td>
      <td style="text-align:right">—</td>
      <td style="text-align:right;font-weight:600">{fmt(paie['brut'])}</td>
    </tr>
  </tbody>
  <tbody style="color:#C62828">
    <tr>
      <td>Retenue CNSS (salarié)</td>
      <td style="text-align:right">Sur {min(paie['brut'],6000):,.0f} MAD</td>
      <td style="text-align:right">4,48%</td>
      <td style="text-align:right">− {fmt(paie['cnss'])}</td>
    </tr>
    <tr>
      <td>Retenue AMO (salarié)</td>
      <td style="text-align:right">Sur {paie['brut']:,.0f} MAD</td>
      <td style="text-align:right">2,26%</td>
      <td style="text-align:right">− {fmt(paie['amo'])}</td>
    </tr>
    <tr>
      <td>Impôt sur le Revenu (IR)</td>
      <td style="text-align:right">Revenu imposable</td>
      <td style="text-align:right">Barème</td>
      <td style="text-align:right">− {fmt(paie['ir'])}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="3">Total retenues</td>
      <td style="text-align:right">− {fmt(paie['total_ret'])}</td>
    </tr>
    <tr class="net-row">
      <td colspan="3">💰 SALAIRE NET À PAYER</td>
      <td style="text-align:right">{fmt(paie['net'])}</td>
    </tr>
  </tfoot>
</table>

<div class="signature">
  <div class="sig-bloc">
    <div class="sig-ligne">Signature employeur</div>
  </div>
  <div class="sig-bloc">
    <div class="sig-ligne">Signature employé (lu et approuvé)</div>
  </div>
</div>

<div class="ft">
  <span>🎂 {nom_app} — Bulletin de paie confidentiel</span>
  <span>Mois : {mois_label}</span>
</div>

</body>
</html>"""


# ── Point d'entrée ─────────────────────────────────────────────────────────────

def main():
    data      = load_data(DATA_FILE)
    employes  = data.get('employees', [])
    settings  = data.get('appSettings', {})
    nom_app   = settings.get('name', 'Coop Tafernout')
    mois      = datetime.now().strftime('%B %Y').capitalize()

    actifs = [e for e in employes if e.get('status') == 'actif']
    if not actifs:
        print("⚠️  Aucun employé actif trouvé dans les données.")
        sys.exit(0)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\n🚀 Génération des fiches de paie — {mois}")
    print(f"   Employés actifs : {len(actifs)}")
    print("─"*50)

    total_net  = 0
    total_brut = 0

    for emp in actifs:
        paie     = calculer_paie(emp)
        html     = build_fiche_html(emp, paie, settings, mois)
        filename = f"paie_{emp['name'].replace(' ','_').lower()}_{datetime.now().strftime('%Y%m')}.html"
        filepath = os.path.join(OUTPUT_DIR, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

        total_brut += paie['brut']
        total_net  += paie['net']

        print(f"   ✅ {emp['name']:<30} Brut: {paie['brut']:>6,.0f} MAD  Net: {paie['net']:>6,.0f} MAD")

    print("─"*50)
    print(f"   📊 TOTAL MASSE SALARIALE BRUTE  : {total_brut:>8,.0f} MAD")
    print(f"   💰 TOTAL SALAIRES NETS          : {total_net:>8,.0f} MAD")
    print(f"\n✅ {len(actifs)} fiche(s) de paie générée(s) dans : {OUTPUT_DIR}/\n")


if __name__ == '__main__':
    main()
