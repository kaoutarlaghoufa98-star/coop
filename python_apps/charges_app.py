#!/usr/bin/env python3
# ════════════════════════════════════════════════════════════════
# COOP TAFERNOUT — Application Charges & Pertes (Python / tkinter)
# Même thème visuel que l'application principale Electron
# ════════════════════════════════════════════════════════════════

import tkinter as tk
from tkinter import ttk, messagebox
import json, os, sys
from datetime import datetime

def get_data_file():
    if sys.platform == 'win32':
        base = os.environ.get('APPDATA', os.path.expanduser('~'))
    elif sys.platform == 'darwin':
        base = os.path.expanduser('~/Library/Application Support')
    else:
        base = os.path.expanduser('~/.config')
    path = os.path.join(base, 'coop-tafernout', 'tafernout_data.json')
    if not os.path.exists(path):
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tafernout_data.json')
    return path

DATA_FILE = get_data_file()

C = {
    'bg':'#FBF6F1', 'card':'#FFFFFF', 'primary':'#5C3317', 'primary2':'#7A4520',
    'gold':'#C9952A', 'border':'#E8C9A8', 'text':'#1A0E08', 'text3':'#9B7B6A',
    'be1':'#F7EDE4', 'be2':'#F2E0D0', 'ok':'#2E7D32', 'danger':'#C62828',
    'warn':'#E65100', 'info':'#1565C0', 'ok_bg':'#E8F5E9', 'danger_bg':'#FFEBEE',
    'warn_bg':'#FFF3E0', 'info_bg':'#E3F2FD',
}
FONT_TITLE = ('Georgia', 15, 'bold')
FONT_HEAD  = ('Segoe UI', 10, 'bold')
FONT_BODY  = ('Segoe UI', 10)
FONT_SMALL = ('Segoe UI', 9)

CATEGORIES = ['Loyer','Matières premières','Énergie','Emballages','Personnel',
               'Maintenance','Transport','Production','Autres']

def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Erreur : {e}")
    return {'charges': [], 'appSettings': {}}

def save_data(data):
    try:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        messagebox.showerror('Erreur', f'Impossible de sauvegarder :\n{e}')
        return False

def fmt_mad(n):
    try:    return f"{float(n):,.2f} MAD"
    except: return "0.00 MAD"

def today():
    return datetime.now().strftime('%Y-%m-%d')

def make_btn(parent, text, cmd, bg=None, fg='white', **kw):
    return tk.Button(parent, text=text, command=cmd,
                     bg=bg or C['primary'], fg=fg, font=FONT_HEAD,
                     relief='flat', bd=0, padx=12, pady=6, cursor='hand2', **kw)

# ══════════════════════════════════════════════════════════════════
# CARTE STATISTIQUE
# ══════════════════════════════════════════════════════════════════

class StatCard(tk.Frame):
    def __init__(self, parent, label, value, sub='', accent='#1565C0'):
        super().__init__(parent, bg=C['card'],
                         highlightbackground=C['border'], highlightthickness=1)
        tk.Frame(self, bg=accent, height=3).pack(fill='x')
        inner = tk.Frame(self, bg=C['card'], padx=14, pady=10); inner.pack(fill='both', expand=True)
        tk.Label(inner, text=label, font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')
        tk.Label(inner, text=str(value), font=('Georgia',18,'bold'), fg=C['text'], bg=C['card']).pack(anchor='w')
        if sub:
            tk.Label(inner, text=sub, font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')

# ══════════════════════════════════════════════════════════════════
# DIALOGUE — Nouvelle charge / perte
# ══════════════════════════════════════════════════════════════════

class ChargeDialog(tk.Toplevel):
    def __init__(self, parent, charge=None):
        super().__init__(parent)
        self.result = None
        self.charge = charge
        self.title('✏️ Modifier' if charge else '➕ Nouvelle charge / perte')
        self.configure(bg=C['bg'])
        self.resizable(False, False)
        self.grab_set()
        self.transient(parent)
        self._build()
        w, h = 520, 520
        x = parent.winfo_rootx() + (parent.winfo_width() - w) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - h) // 2
        self.geometry(f'{w}x{h}+{x}+{y}')

    def _build(self):
        # En-tête
        hd = tk.Frame(self, bg=C['be1'], padx=20, pady=14); hd.pack(fill='x')
        tk.Label(hd, text='✏️ Modifier' if self.charge else '➕ Nouvelle charge / perte',
                 font=FONT_TITLE, fg=C['primary'], bg=C['be1']).pack(anchor='w')
        tk.Frame(hd, bg=C['border'], height=1).pack(fill='x', pady=(8,0))

        body = tk.Frame(self, bg=C['bg'], padx=20, pady=16); body.pack(fill='both', expand=True)

        # Sélecteur Charge / Perte
        sel_f = tk.Frame(body, bg=C['be1'], padx=10, pady=10); sel_f.pack(fill='x', pady=(0,12))
        self.v_type = tk.StringVar(value=self.charge.get('type','charge') if self.charge else 'charge')

        def toggle_type(t):
            self.v_type.set(t)
            btn_charge.config(bg=C['primary'] if t=='charge' else C['be2'],
                               fg='white'     if t=='charge' else C['primary'])
            btn_perte.config( bg=C['danger']  if t=='perte'  else C['be2'],
                               fg='white'     if t=='perte'  else C['primary'])

        btn_charge = tk.Button(sel_f, text='📋 Charge', command=lambda: toggle_type('charge'),
                                bg=C['primary'], fg='white', font=FONT_HEAD,
                                relief='flat', bd=0, padx=16, pady=8, cursor='hand2')
        btn_charge.pack(side='left', expand=True, fill='x', padx=(0,4))
        btn_perte  = tk.Button(sel_f, text='📉 Perte', command=lambda: toggle_type('perte'),
                                bg=C['be2'], fg=C['primary'], font=FONT_HEAD,
                                relief='flat', bd=0, padx=16, pady=8, cursor='hand2')
        btn_perte.pack(side='left', expand=True, fill='x')
        toggle_type(self.v_type.get())

        def field(lbl, widget_fn):
            f = tk.Frame(body, bg=C['bg']); f.pack(fill='x', pady=4)
            tk.Label(f, text=lbl, font=FONT_SMALL, fg=C['primary'],
                     bg=C['bg'], width=18, anchor='w').pack(side='left')
            w = widget_fn(f); w.pack(side='left', fill='x', expand=True)
            return w

        self.v_label    = tk.StringVar(value=self.charge.get('label','') if self.charge else '')
        self.v_category = tk.StringVar(value=self.charge.get('category','') if self.charge else '')
        self.v_date     = tk.StringVar(value=self.charge.get('date', today()) if self.charge else today())
        self.v_amount   = tk.StringVar(value=str(self.charge.get('amount','')) if self.charge else '')
        self.v_supplier = tk.StringVar(value=self.charge.get('supplier','') if self.charge else '')
        self.v_paid     = tk.BooleanVar(value=self.charge.get('paid', False) if self.charge else False)

        field('📝 Libellé *',   lambda p: tk.Entry(p, textvariable=self.v_label, font=FONT_BODY, relief='solid', bd=1))
        field('🏷️ Catégorie',  lambda p: ttk.Combobox(p, textvariable=self.v_category, values=CATEGORIES, font=FONT_BODY))
        field('📅 Date',        lambda p: tk.Entry(p, textvariable=self.v_date, font=FONT_BODY, relief='solid', bd=1))
        field('💰 Montant MAD *',lambda p: tk.Entry(p, textvariable=self.v_amount, font=FONT_BODY, relief='solid', bd=1))
        field('🏭 Fournisseur', lambda p: tk.Entry(p, textvariable=self.v_supplier, font=FONT_BODY, relief='solid', bd=1))

        # Toggle payé
        paid_f = tk.Frame(body, bg=C['bg']); paid_f.pack(fill='x', pady=8)
        self.paid_btn = tk.Button(paid_f, text='✅ Déjà payée',
                                   command=self._toggle_paid,
                                   font=FONT_HEAD, relief='flat', bd=0,
                                   padx=12, pady=6, cursor='hand2')
        self._update_paid_btn()
        self.paid_btn.pack(side='left')

        ft = tk.Frame(self, bg=C['be1'], padx=20, pady=10); ft.pack(fill='x', side='bottom')
        tk.Frame(ft, bg=C['border'], height=1).pack(fill='x', pady=(0,8))
        make_btn(ft,'💾 Enregistrer', self._save).pack(side='right', padx=4)
        make_btn(ft,'Annuler', self.destroy, bg=C['be1'], fg=C['primary']).pack(side='right')

    def _toggle_paid(self):
        self.v_paid.set(not self.v_paid.get())
        self._update_paid_btn()

    def _update_paid_btn(self):
        if self.v_paid.get():
            self.paid_btn.config(bg=C['ok_bg'], fg=C['ok'], text='✅ Déjà payée')
        else:
            self.paid_btn.config(bg=C['be2'], fg=C['text3'], text='⬜ Non payée')

    def _save(self):
        label = self.v_label.get().strip()
        if not label:
            messagebox.showwarning('Requis', 'Le libellé est obligatoire.', parent=self); return
        amount_str = self.v_amount.get().strip()
        try:
            amount = float(amount_str)
            if amount <= 0: raise ValueError
        except:
            messagebox.showwarning('Montant invalide', 'Entrez un montant valide > 0.', parent=self); return

        self.result = {
            'id':       self.charge['id'] if self.charge else int(datetime.now().timestamp()*1000),
            'date':     self.v_date.get().strip() or today(),
            'label':    label,
            'category': self.v_category.get().strip(),
            'type':     self.v_type.get(),
            'amount':   amount,
            'supplier': self.v_supplier.get().strip(),
            'paid':     self.v_paid.get(),
        }
        self.destroy()

# ══════════════════════════════════════════════════════════════════
# FENÊTRE PRINCIPALE — Charges & Pertes
# ══════════════════════════════════════════════════════════════════

class ChargesApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.data = load_data()
        s = self.data.get('appSettings', {})
        self.title(f"💸 Charges & Pertes — {s.get('name','Coop Tafernout')}")
        self.geometry('1200x740'); self.minsize(900,600)
        self.configure(bg=C['bg'])
        self._build_ui()
        self._refresh()

    def _build_ui(self):
        # En-tête
        hd = tk.Frame(self, bg=C['card'], highlightbackground=C['border'], highlightthickness=1)
        hd.pack(fill='x')
        ih = tk.Frame(hd, bg=C['card'], padx=24, pady=14); ih.pack(fill='x')
        tk.Label(ih, text='💸', font=('Segoe UI',22), fg=C['primary'], bg=C['card']).pack(side='left')
        tk.Label(ih, text='Charges & Pertes', font=FONT_TITLE, fg=C['primary'], bg=C['card']).pack(side='left', padx=10)
        make_btn(ih,'🔄', self._reload, bg=C['be1'], fg=C['primary']).pack(side='right', padx=4)
        make_btn(ih,'➕ Nouvelle entrée', self._new_charge).pack(side='right', padx=4)

        body = tk.Frame(self, bg=C['bg'], padx=20, pady=16); body.pack(fill='both', expand=True)

        # Cartes stats
        self.stat_frame = tk.Frame(body, bg=C['bg']); self.stat_frame.pack(fill='x', pady=(0,16))

        # Contenu principal : table + graphique côte à côte
        content = tk.Frame(body, bg=C['bg']); content.pack(fill='both', expand=True)
        content.columnconfigure(0, weight=3); content.columnconfigure(1, weight=1)

        # ── Tableau charges ──
        left_f = tk.Frame(content, bg=C['bg']); left_f.grid(row=0, column=0, sticky='nsew', padx=(0,12))
        style = ttk.Style()
        style.configure('Taf.Treeview', font=FONT_BODY, rowheight=32, background='white',
                        fieldbackground='white', foreground=C['text'])
        style.configure('Taf.Treeview.Heading', font=FONT_SMALL, background=C['bg'], foreground=C['text3'])
        style.map('Taf.Treeview', background=[('selected',C['be1'])], foreground=[('selected',C['text'])])

        cols = ('Date','Libellé','Type','Catégorie','Montant','Statut')
        self.tree = ttk.Treeview(left_f, columns=cols, show='headings',
                                  style='Taf.Treeview', selectmode='browse')
        for col, w in zip(cols, [90, 220, 90, 120, 110, 90]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, minwidth=60, anchor='e' if col=='Montant' else 'w')
        vsb = ttk.Scrollbar(left_f, orient='vertical', command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right', fill='y'); self.tree.pack(fill='both', expand=True)

        acts = tk.Frame(left_f, bg=C['be1'], padx=12, pady=8); acts.pack(fill='x')
        make_btn(acts,'✅ Marquer payé',  self._toggle_paid,  bg=C['ok_bg'], fg=C['ok']).pack(side='left', padx=4)
        make_btn(acts,'🗑️ Supprimer',    self._del_selected, bg=C['danger_bg'], fg=C['danger']).pack(side='left')

        # ── Graphique par catégorie ──
        right_f = tk.Frame(content, bg=C['card'], padx=16, pady=14,
                            highlightbackground=C['border'], highlightthickness=1)
        right_f.grid(row=0, column=1, sticky='nsew')
        tk.Label(right_f, text='📊 Par catégorie', font=FONT_HEAD,
                 fg=C['primary'], bg=C['card']).pack(anchor='w', pady=(0,10))
        self.chart_frame = tk.Frame(right_f, bg=C['card']); self.chart_frame.pack(fill='both', expand=True)

        # Barre de statut
        self.status_var = tk.StringVar(value='Prêt')
        tk.Label(self, textvariable=self.status_var, font=FONT_SMALL, fg='white',
                 bg=C['primary'], anchor='w', padx=16, pady=5).pack(fill='x', side='bottom')

    def _refresh(self):
        charges = self.data.get('charges', [])

        # Calculs
        total   = sum(c['amount'] for c in charges)
        tc      = sum(c['amount'] for c in charges if c.get('type') != 'perte')
        tp      = sum(c['amount'] for c in charges if c.get('type') == 'perte')
        impayé  = sum(c['amount'] for c in charges if not c.get('paid'))

        # Cartes stats
        for w in self.stat_frame.winfo_children(): w.destroy()
        cards_data = [
            ('💸 Total',       fmt_mad(total),  '',                  C['info']),
            ('📋 Charges',     fmt_mad(tc),     f'{len([c for c in charges if c.get("type")!="perte"])} entrées', C['warn']),
            ('📉 Pertes',      fmt_mad(tp),     f'{len([c for c in charges if c.get("type")=="perte"])} pertes',  C['danger']),
            ('⏳ Impayées',    fmt_mad(impayé), '',                  '#558B2F'),
        ]
        for i, (label, value, sub, color) in enumerate(cards_data):
            StatCard(self.stat_frame, label, value, sub=sub, accent=color
                     ).grid(row=0, column=i, sticky='nsew', padx=6)
            self.stat_frame.columnconfigure(i, weight=1)

        # Tableau
        for row in self.tree.get_children(): self.tree.delete(row)
        for c in charges:
            t_type  = ('perte', C['danger_bg']) if c.get('type')=='perte' else ('charge', C['info_bg'])
            t_paid  = ('payé',  C['ok_bg'])     if c.get('paid')          else ('impayé', C['warn_bg'])
            self.tree.insert('', 'end', iid=str(c['id']),
                             values=(c.get('date',''), c.get('label',''),
                                     '📉 Perte' if c.get('type')=='perte' else '📋 Charge',
                                     c.get('category','—'),
                                     fmt_mad(c.get('amount',0)),
                                     '✅ Payé' if c.get('paid') else '⏳ Impayé'),
                             tags=(t_type[0], t_paid[0]))
        self.tree.tag_configure('perte',  foreground=C['danger'])
        self.tree.tag_configure('impayé', background=C['warn_bg'])
        self.tree.tag_configure('payé',   background=C['ok_bg'])

        # Graphique barres par catégorie (canvas)
        for w in self.chart_frame.winfo_children(): w.destroy()
        by_cat = {}
        for c in charges:
            cat = c.get('category') or 'Autre'
            by_cat[cat] = by_cat.get(cat, 0) + c.get('amount', 0)
        by_cat = dict(sorted(by_cat.items(), key=lambda x: x[1], reverse=True))

        if by_cat and total > 0:
            canvas = tk.Canvas(self.chart_frame, bg=C['card'], highlightthickness=0)
            canvas.pack(fill='both', expand=True)
            self.chart_frame.update_idletasks()
            W = max(self.chart_frame.winfo_width(), 200)
            bar_h = 22; gap = 10; y0 = 10
            for cat, val in list(by_cat.items())[:8]:
                pct = val / total
                bw  = int((W - 90) * pct)
                canvas.create_text(4, y0 + bar_h//2, text=cat[:14], anchor='w',
                                   font=FONT_SMALL, fill=C['text'])
                canvas.create_rectangle(90, y0, 90 + max(bw, 4), y0 + bar_h,
                                         fill=C['primary'], outline='')
                canvas.create_text(90 + max(bw,4) + 4, y0 + bar_h//2,
                                   text=fmt_mad(val), anchor='w',
                                   font=FONT_SMALL, fill=C['primary'])
                y0 += bar_h + gap
        else:
            tk.Label(self.chart_frame, text='Aucune donnée', font=FONT_SMALL,
                     fg=C['text3'], bg=C['card']).pack(pady=30)

    def _reload(self):
        self.data = load_data(); self._refresh(); self._set_status('✅ Données rechargées')

    def _new_charge(self):
        dlg = ChargeDialog(self)
        self.wait_window(dlg)
        if dlg.result:
            self.data.setdefault('charges', []).insert(0, dlg.result)
            if save_data(self.data):
                self._refresh()
                t = 'Perte' if dlg.result['type']=='perte' else 'Charge'
                self._set_status(f'✅ {t} enregistrée')

    def _toggle_paid(self):
        sel = self.tree.selection()
        if not sel: messagebox.showinfo('Info','Sélectionnez une entrée.'); return
        cid = int(sel[0])
        for c in self.data.get('charges', []):
            if c['id'] == cid:
                c['paid'] = not c.get('paid', False)
                break
        if save_data(self.data):
            self._refresh(); self._set_status('✅ Statut mis à jour')

    def _del_selected(self):
        sel = self.tree.selection()
        if not sel: messagebox.showinfo('Info','Sélectionnez une entrée.'); return
        if messagebox.askyesno('Supprimer','Supprimer cette entrée ?'):
            cid = int(sel[0])
            self.data['charges'] = [c for c in self.data.get('charges',[]) if c['id']!=cid]
            if save_data(self.data):
                self._refresh(); self._set_status('🗑️ Entrée supprimée')

    def _set_status(self, msg):
        self.status_var.set(msg)
        self.after(3000, lambda: self.status_var.set('Prêt'))

if __name__ == '__main__':
    ChargesApp().mainloop()
