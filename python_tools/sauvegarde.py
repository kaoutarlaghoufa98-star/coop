#!/usr/bin/env python3
# ════════════════════════════════════════════════
# COOP TAFERNOUT — Gestionnaire de sauvegardes
# Crée, liste, restaure et purge les sauvegardes
# automatiques du fichier de données JSON.
# ════════════════════════════════════════════════

import json
import os
import sys
import shutil
import argparse
from datetime import datetime


# ── Configuration ─────────────────────────────────────────────────────────────

DATA_FILE      = os.path.join(os.path.dirname(__file__), '..', 'tafernout_data.json')
BACKUP_DIR     = os.path.join(os.path.dirname(__file__), '..', 'sauvegardes')
MAX_BACKUPS    = 10   # Nombre max de sauvegardes à conserver
BACKUP_PREFIX  = 'tafernout_backup_'


# ── Couleurs console ───────────────────────────────────────────────────────────

class C:
    VERT   = '\033[92m'
    ROUGE  = '\033[91m'
    ORANGE = '\033[93m'
    BLEU   = '\033[94m'
    GRAS   = '\033[1m'
    RESET  = '\033[0m'

def ok(t):     return f"{C.VERT}{C.GRAS}✅ {t}{C.RESET}"
def err(t):    return f"{C.ROUGE}{C.GRAS}❌ {t}{C.RESET}"
def warn(t):   return f"{C.ORANGE}⚠️  {t}{C.RESET}"
def info(t):   return f"{C.BLEU}ℹ️  {t}{C.RESET}"
def gras(t):   return f"{C.GRAS}{t}{C.RESET}"


# ── Chargement des données ─────────────────────────────────────────────────────

def load_data(path):
    if not os.path.exists(path):
        print(err(f"Fichier introuvable : {path}"))
        print("    Lancez d'abord l'application pour créer le fichier de données.")
        sys.exit(1)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


# ── Création d'une sauvegarde ──────────────────────────────────────────────────

def creer_sauvegarde(label=None):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    now  = datetime.now().strftime('%Y%m%d_%H%M%S')
    name = f"{BACKUP_PREFIX}{now}"
    if label:
        safe_label = label.replace(' ', '_').replace('/', '-')[:30]
        name += f"_{safe_label}"
    name += '.json'
    dest = os.path.join(BACKUP_DIR, name)

    shutil.copy2(DATA_FILE, dest)
    size = os.path.getsize(dest)
    print(ok(f"Sauvegarde créée : {name}  ({size} octets)"))

    # Résumé du contenu sauvegardé
    try:
        data = load_data(dest)
        print(f"   🎂 Produits  : {len(data.get('products',[]))}")
        print(f"   👥 Clients   : {len(data.get('clients',[]))}")
        print(f"   💰 Ventes    : {len(data.get('sales',[]))}")
        print(f"   📋 Commandes : {len(data.get('commandes',[]))}")
        print(f"   👤 Employés  : {len(data.get('employees',[]))}")
    except Exception:
        pass

    # Rotation automatique
    purger_anciennes(silencieux=True)
    return dest


# ── Liste des sauvegardes ──────────────────────────────────────────────────────

def lister_sauvegardes():
    if not os.path.exists(BACKUP_DIR):
        print(warn("Aucun dossier de sauvegardes trouvé."))
        return []

    fichiers = sorted([
        f for f in os.listdir(BACKUP_DIR)
        if f.startswith(BACKUP_PREFIX) and f.endswith('.json')
    ], reverse=True)

    if not fichiers:
        print(warn("Aucune sauvegarde disponible."))
        return []

    print(gras(f"\n  📁 {len(fichiers)} sauvegarde(s) disponible(s)"))
    print("  " + "─"*70)
    print(f"  {'#':<4} {'Fichier':<50} {'Taille':<10} {'Date'}")
    print("  " + "─"*70)

    for i, f in enumerate(fichiers, 1):
        path = os.path.join(BACKUP_DIR, f)
        size = os.path.getsize(path)
        mtime = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%d/%m/%Y %H:%M')
        marker = " ◀ PLUS RÉCENTE" if i == 1 else ""
        print(f"  {i:<4} {f:<50} {size:<10} {mtime}{C.VERT if i==1 else ''}{marker}{C.RESET}")

    print()
    return fichiers


# ── Restauration d'une sauvegarde ─────────────────────────────────────────────

def restaurer(numero=None, fichier=None):
    fichiers = sorted([
        f for f in os.listdir(BACKUP_DIR)
        if f.startswith(BACKUP_PREFIX) and f.endswith('.json')
    ], reverse=True) if os.path.exists(BACKUP_DIR) else []

    if not fichiers:
        print(err("Aucune sauvegarde disponible."))
        return

    if numero is not None:
        if numero < 1 or numero > len(fichiers):
            print(err(f"Numéro invalide. Choisissez entre 1 et {len(fichiers)}."))
            return
        source_name = fichiers[numero - 1]
    elif fichier:
        source_name = fichier if fichier.endswith('.json') else fichier + '.json'
        if source_name not in fichiers:
            print(err(f"Fichier introuvable : {source_name}"))
            return
    else:
        source_name = fichiers[0]
        print(info(f"Restauration de la sauvegarde la plus récente : {source_name}"))

    source = os.path.join(BACKUP_DIR, source_name)

    # Sauvegarde de sécurité avant restauration
    now  = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe = os.path.join(BACKUP_DIR, f"{BACKUP_PREFIX}{now}_avant_restauration.json")
    shutil.copy2(DATA_FILE, safe)
    print(info(f"Sauvegarde de sécurité créée : {os.path.basename(safe)}"))

    # Confirmation
    print(warn(f"Vous allez restaurer : {source_name}"))
    reponse = input("  Confirmer la restauration ? (oui/non) : ").strip().lower()
    if reponse not in ('oui', 'o', 'yes', 'y'):
        print(warn("Restauration annulée."))
        return

    shutil.copy2(source, DATA_FILE)
    print(ok(f"Données restaurées depuis : {source_name}"))
    print(warn("Relancez l'application pour prendre en compte les données restaurées."))


# ── Purge des anciennes sauvegardes ───────────────────────────────────────────

def purger_anciennes(silencieux=False):
    if not os.path.exists(BACKUP_DIR):
        return

    fichiers = sorted([
        f for f in os.listdir(BACKUP_DIR)
        if f.startswith(BACKUP_PREFIX) and f.endswith('.json')
    ], reverse=True)

    # Garde les sauvegardes de sécurité (avant_restauration)
    normaux  = [f for f in fichiers if 'avant_restauration' not in f]
    securite = [f for f in fichiers if 'avant_restauration' in f]

    supprimes = 0
    for f in normaux[MAX_BACKUPS:]:
        os.remove(os.path.join(BACKUP_DIR, f))
        supprimes += 1
        if not silencieux:
            print(warn(f"Sauvegarde ancienne supprimée : {f}"))

    if not silencieux and supprimes > 0:
        print(ok(f"{supprimes} ancienne(s) sauvegarde(s) supprimée(s)"))
    elif not silencieux:
        print(ok("Aucune purge nécessaire."))


# ── Parser CLI ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Gestionnaire de sauvegardes — Coop Tafernout',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commandes :
  python sauvegarde.py                    → Crée une sauvegarde
  python sauvegarde.py --liste            → Liste toutes les sauvegardes
  python sauvegarde.py --restaurer 2      → Restaure la sauvegarde n°2
  python sauvegarde.py --restaurer-last   → Restaure la plus récente
  python sauvegarde.py --purge            → Purge les anciennes sauvegardes
  python sauvegarde.py --label "avant migration"  → Sauvegarde avec étiquette
        """
    )
    parser.add_argument('--liste',         action='store_true', help='Lister les sauvegardes disponibles')
    parser.add_argument('--restaurer',     type=int,            help='Restaurer la sauvegarde numéro N')
    parser.add_argument('--restaurer-last',action='store_true', help='Restaurer la sauvegarde la plus récente')
    parser.add_argument('--purge',         action='store_true', help='Purger les anciennes sauvegardes')
    parser.add_argument('--label',         type=str,            help='Étiquette pour la sauvegarde')
    parser.add_argument('--max',           type=int,            help=f'Nombre max de sauvegardes (défaut: {MAX_BACKUPS})')

    args = parser.parse_args()

    nom = "Coop Tafernout"
    try:
        data = load_data(DATA_FILE)
        nom  = data.get('appSettings', {}).get('name', nom)
    except SystemExit:
        if not args.liste:
            raise

    print(f"\n🥐 {nom.upper()} — Gestionnaire de sauvegardes")
    print("─"*50)

    if args.max:
        global MAX_BACKUPS
        MAX_BACKUPS = args.max

    if args.liste:
        lister_sauvegardes()
    elif args.purge:
        purger_anciennes(silencieux=False)
    elif args.restaurer is not None:
        restaurer(numero=args.restaurer)
    elif args.restaurer_last:
        restaurer()
    else:
        # Par défaut : créer une sauvegarde
        creer_sauvegarde(label=args.label)

    print()


if __name__ == '__main__':
    main()
