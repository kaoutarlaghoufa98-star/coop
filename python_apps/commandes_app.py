#!/usr/bin/env python3
# ════════════════════════════════════════════════════════════════
# COOP TAFERNOUT — Application Commandes (Python / tkinter)
# Même thème visuel que l'application principale Electron
# Lit et écrit dans le même fichier tafernout_data.json
# ════════════════════════════════════════════════════════════════

import tkinter as tk
from tkinter import ttk, messagebox
import json, os, sys
from datetime import datetime

# ── Localisation du fichier de données Electron ──────────────────
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

# ══════════════════════════════════════════════════════════════════
# THÈME — Couleurs identiques à main.css
# ══════════════════════════════════════════════════════════════════
C = {
    'bg':        '#FBF6F1', 'sidebar':  '#2C1810', 'card':     '#FFFFFF',
    'primary':   '#5C3317', 'primary2': '#7A4520', 'gold':     '#C9952A',
    'border':    '#E8C9A8', 'text':     '#1A0E08', 'text2':    '#5C3D2E',
    'text3':     '#9B7B6A', 'be1':      '#F7EDE4', 'be2':      '#F2E0D0',
    'ok':        '#2E7D32', 'danger':   '#C62828', 'warn':     '#E65100',
    'info':      '#1565C0', 'ok_bg':    '#E8F5E9', 'danger_bg':'#FFEBEE',
    'warn_bg':   '#FFF3E0', 'info_bg':  '#E3F2FD',
}
FONT_TITLE = ('Georgia', 15, 'bold')
FONT_HEAD  = ('Segoe UI', 10, 'bold')
FONT_BODY  = ('Segoe UI', 10)
FONT_SMALL = ('Segoe UI', 9)

STATUTS = ['en_cours', 'confirmée', 'livrée', 'annulée']
STATUT_COLORS = {
    'en_cours':  (C['info_bg'],   C['info']),
    'confirmée': (C['ok_bg'],     C['ok']),
    'livrée':    ('#F1F8E9',      '#558B2F'),
    'annulée':   (C['danger_bg'], C['danger']),
}

# ══════════════════════════════════════════════════════════════════
# UTILITAIRES
# ══════════════════════════════════════════════════════════════════

def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Erreur chargement : {e}")
    return {'commandes': [], 'clients': [], 'products': [], 'appSettings': {}}

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
    b = tk.Button(parent, text=text, command=cmd,
                  bg=bg or C['primary'], fg=fg,
                  font=FONT_HEAD, relief='flat', bd=0,
                  padx=12, pady=6, cursor='hand2', **kw)
    return b

# ══════════════════════════════════════════════════════════════════
# CARTE STATISTIQUE
# ══════════════════════════════════════════════════════════════════

class StatCard(tk.Frame):
    def __init__(self, parent, label, value, sub='', accent='#1565C0'):
        super().__init__(parent, bg=C['card'],
                         highlightbackground=C['border'], highlightthickness=1)
        tk.Frame(self, bg=accent, height=3).pack(fill='x')
        inner = tk.Frame(self, bg=C['card'], padx=14, pady=10)
        inner.pack(fill='both', expand=True)
        tk.Label(inner, text=label, font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')
        tk.Label(inner, text=str(value), font=('Georgia', 18, 'bold'),
                 fg=C['text'], bg=C['card']).pack(anchor='w')
        if sub:
            tk.Label(inner, text=sub, font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')

# ══════════════════════════════════════════════════════════════════
# DIALOGUE — Nouvelle / Modifier commande
# ══════════════════════════════════════════════════════════════════

class CommandeDialog(tk.Toplevel):
    def __init__(self, parent, data, commande=None):
        super().__init__(parent)
        self.result   = None
        self.data     = data
        self.commande = commande
        self.items    = [dict(i) for i in commande['items']] if commande else [{'name':'','qty':1,'price':0}]
        self.title('✏️ Modifier commande' if commande else '➕ Nouvelle commande')
        self.configure(bg=C['bg'])
        self.resizable(False, False)
        self.grab_set()
        self.transient(parent)
        self._build()
        w, h = 620, 680
        x = parent.winfo_rootx() + (parent.winfo_width() - w) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - h) // 2
        self.geometry(f'{w}x{h}+{x}+{y}')

    def _build(self):
        # En-tête
        hd = tk.Frame(self, bg=C['be1'], padx=20, pady=14)
        hd.pack(fill='x')
        tk.Label(hd, text='✏️ Modifier' if self.commande else '➕ Nouvelle commande',
                 font=FONT_TITLE, fg=C['primary'], bg=C['be1']).pack(anchor='w')
        tk.Frame(hd, bg=C['border'], height=1).pack(fill='x', pady=(8,0))

        # Formulaire scrollable
        outer = tk.Frame(self, bg=C['bg'])
        outer.pack(fill='both', expand=True)
        canvas = tk.Canvas(outer, bg=C['bg'], highlightthickness=0)
        vsb = ttk.Scrollbar(outer, orient='vertical', command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right', fill='y')
        canvas.pack(side='left', fill='both', expand=True)

        body = tk.Frame(canvas, bg=C['bg'], padx=20, pady=14)
        canvas.create_window((0,0), window=body, anchor='nw')
        body.bind('<Configure>', lambda e: canvas.configure(
            scrollregion=canvas.bbox('all')))

        def field(lbl, widget_fn):
            f = tk.Frame(body, bg=C['bg'])
            f.pack(fill='x', pady=4)
            tk.Label(f, text=lbl, font=FONT_SMALL, fg=C['primary'],
                     bg=C['bg'], width=18, anchor='w').pack(side='left')
            w = widget_fn(f)
            w.pack(side='left', fill='x', expand=True)
            return w

        clients = [c['name'] for c in self.data.get('clients', [])]
        self.v_client   = tk.StringVar(value=self.commande.get('client','') if self.commande else '')
        self.v_phone    = tk.StringVar(value=self.commande.get('phone','') if self.commande else '')
        self.v_livraison= tk.StringVar(value=self.commande.get('livraison', today()) if self.commande else today())
        self.v_statut   = tk.StringVar(value=self.commande.get('statut','en_cours') if self.commande else 'en_cours')

        field('👤 Client *',       lambda p: ttk.Combobox(p, textvariable=self.v_client, values=clients, font=FONT_BODY))
        field('📞 Téléphone',      lambda p: tk.Entry(p, textvariable=self.v_phone, font=FONT_BODY, relief='solid', bd=1))
        field('🚚 Date livraison', lambda p: tk.Entry(p, textvariable=self.v_livraison, font=FONT_BODY, relief='solid', bd=1))
        field('🏷️ Statut',        lambda p: ttk.Combobox(p, textvariable=self.v_statut, values=STATUTS, font=FONT_BODY, state='readonly'))

        nf = tk.Frame(body, bg=C['bg']); nf.pack(fill='x', pady=4)
        tk.Label(nf, text='📝 Notes', font=FONT_SMALL, fg=C['primary'],
                 bg=C['bg'], width=18, anchor='nw').pack(side='left', anchor='n')
        self.v_notes = tk.Text(nf, height=3, font=FONT_BODY, relief='solid', bd=1)
        if self.commande: self.v_notes.insert('1.0', self.commande.get('notes',''))
        self.v_notes.pack(side='left', fill='x', expand=True)

        tk.Frame(body, bg=C['border'], height=1).pack(fill='x', pady=8)
        tk.Label(body, text='📦 ARTICLES', font=FONT_SMALL, fg=C['primary'],
                 bg=C['bg']).pack(anchor='w', pady=(0,6))

        self.items_frame = tk.Frame(body, bg=C['bg'])
        self.items_frame.pack(fill='x')
        self._products = [p['name'] for p in self.data.get('products', [])]
        self.item_rows = []
        for item in self.items:
            self._add_item_row(item)

        make_btn(body, '+ Ajouter article', self._add_empty_row,
                 bg=C['be1'], fg=C['primary']).pack(anchor='w', pady=(6,2))

        self.total_var = tk.StringVar()
        self._update_total()
        tk.Label(body, textvariable=self.total_var,
                 font=('Georgia', 13, 'bold'), fg=C['gold'],
                 bg=C['bg']).pack(anchor='e', pady=4)

        # Pied de dialogue
        ft = tk.Frame(self, bg=C['be1'], padx=20, pady=10)
        ft.pack(fill='x', side='bottom')
        tk.Frame(ft, bg=C['border'], height=1).pack(fill='x', pady=(0,8))
        make_btn(ft, '💾 Enregistrer', self._save).pack(side='right', padx=4)
        make_btn(ft, 'Annuler', self.destroy, bg=C['be1'], fg=C['primary']).pack(side='right')

    def _add_empty_row(self):
        self._add_item_row({'name':'','qty':1,'price':0})

    def _add_item_row(self, item):
        f = tk.Frame(self.items_frame, bg=C['bg'])
        f.pack(fill='x', pady=2)
        v_name  = tk.StringVar(value=item.get('name',''))
        v_qty   = tk.StringVar(value=str(item.get('qty',1)))
        v_price = tk.StringVar(value=str(item.get('price',0)))
        cb = ttk.Combobox(f, textvariable=v_name, values=self._products, font=FONT_BODY, width=22)
        cb.pack(side='left', padx=(0,4))
        cb.bind('<<ComboboxSelected>>', lambda e: self._update_total())
        e_qty = tk.Entry(f, textvariable=v_qty, font=FONT_BODY, width=5, relief='solid', bd=1)
        e_qty.pack(side='left', padx=(0,2))
        e_qty.bind('<KeyRelease>', lambda e: self._update_total())
        tk.Label(f, text='×', fg=C['text3'], bg=C['bg'], font=FONT_BODY).pack(side='left')
        e_price = tk.Entry(f, textvariable=v_price, font=FONT_BODY, width=8, relief='solid', bd=1)
        e_price.pack(side='left', padx=(2,4))
        e_price.bind('<KeyRelease>', lambda e: self._update_total())
        tk.Label(f, text='MAD', fg=C['text3'], bg=C['bg'], font=FONT_SMALL).pack(side='left')
        row_data = {'frame': f, 'name': v_name, 'qty': v_qty, 'price': v_price}
        self.item_rows.append(row_data)
        def del_row(rd=row_data):
            if len(self.item_rows) > 1:
                rd['frame'].destroy()
                self.item_rows.remove(rd)
                self._update_total()
        tk.Button(f, text='✕', command=del_row, bg=C['danger_bg'], fg=C['danger'],
                  font=FONT_SMALL, relief='flat', bd=0, padx=6, pady=2,
                  cursor='hand2').pack(side='left', padx=4)

    def _update_total(self):
        total = 0
        for row in self.item_rows:
            try: total += float(row['qty'].get() or 0) * float(row['price'].get() or 0)
            except: pass
        self.total_var.set(f'Total : {fmt_mad(total)}')

    def _save(self):
        client = self.v_client.get().strip()
        if not client:
            messagebox.showwarning('Requis', 'Le nom du client est obligatoire.', parent=self)
            return
        items = []
        for row in self.item_rows:
            nom = row['name'].get().strip()
            try:   qty   = float(row['qty'].get() or 0)
            except: qty  = 0
            try:   price = float(row['price'].get() or 0)
            except: price = 0
            if nom and qty > 0:
                items.append({'name': nom, 'qty': qty, 'price': price})
        if not items:
            messagebox.showwarning('Articles manquants', 'Ajoutez au moins un article.', parent=self)
            return
        total = sum(i['qty'] * i['price'] for i in items)
        n     = str(int(datetime.now().timestamp()))[-6:]
        self.result = {
            'id':        self.commande['id']  if self.commande else int(datetime.now().timestamp()*1000),
            'num':       self.commande['num'] if self.commande else f'CMD-{n}',
            'date':      self.commande['date'] if self.commande else today(),
            'client':    client,
            'phone':     self.v_phone.get().strip(),
            'livraison': self.v_livraison.get().strip(),
            'statut':    self.v_statut.get(),
            'notes':     self.v_notes.get('1.0','end').strip(),
            'items':     items,
            'total':     total,
        }
        self.destroy()

# ══════════════════════════════════════════════════════════════════
# FENÊTRE PRINCIPALE — Commandes
# ══════════════════════════════════════════════════════════════════

class CommandesApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.data = load_data()
        s = self.data.get('appSettings', {})
        self.title(f"📋 Commandes — {s.get('name','Coop Tafernout')}")
        self.geometry('1180x720'); self.minsize(900,600)
        self.configure(bg=C['bg'])
        self._build_ui()
        self._refresh()

    def _build_ui(self):
        # En-tête
        hd = tk.Frame(self, bg=C['card'], highlightbackground=C['border'], highlightthickness=1)
        hd.pack(fill='x')
        ih = tk.Frame(hd, bg=C['card'], padx=24, pady=14); ih.pack(fill='x')
        tk.Label(ih, text='📋', font=('Segoe UI',22), fg=C['primary'], bg=C['card']).pack(side='left')
        tk.Label(ih, text='Commandes Clients', font=FONT_TITLE, fg=C['primary'], bg=C['card']).pack(side='left', padx=10)
        make_btn(ih,'🔄', self._reload, bg=C['be1'], fg=C['primary']).pack(side='right', padx=4)
        make_btn(ih,'➕ Nouvelle commande', self._new_commande).pack(side='right', padx=4)

        # Corps
        body = tk.Frame(self, bg=C['bg'], padx=20, pady=16); body.pack(fill='both', expand=True)

        # Cartes stats
        self.stat_frame = tk.Frame(body, bg=C['bg']); self.stat_frame.pack(fill='x', pady=(0,16))

        # Onglets
        style = ttk.Style()
        style.configure('Taf.TNotebook', background=C['bg'])
        style.configure('Taf.TNotebook.Tab', padding=[14,8], font=FONT_HEAD)
        style.map('Taf.TNotebook.Tab', background=[('selected',C['card'])], foreground=[('selected',C['primary'])])
        self.notebook = ttk.Notebook(body, style='Taf.TNotebook'); self.notebook.pack(fill='both', expand=True)

        # Onglet Kanban
        k_outer = tk.Frame(self.notebook, bg=C['card']); 
        self.notebook.add(k_outer, text='📋 Kanban')
        self.k_canvas = tk.Canvas(k_outer, bg=C['card'], highlightthickness=0)
        k_xsb = ttk.Scrollbar(k_outer, orient='horizontal', command=self.k_canvas.xview)
        self.k_canvas.configure(xscrollcommand=k_xsb.set)
        k_xsb.pack(side='bottom', fill='x'); self.k_canvas.pack(fill='both', expand=True)
        self.kanban_inner = tk.Frame(self.k_canvas, bg=C['card'])
        self.k_canvas.create_window((0,0), window=self.kanban_inner, anchor='nw')
        self.kanban_inner.bind('<Configure>', lambda e: self.k_canvas.configure(
            scrollregion=self.k_canvas.bbox('all')))

        # Onglet Historique
        hist_f = tk.Frame(self.notebook, bg=C['card']); self.notebook.add(hist_f, text='📅 Historique')
        cols_h = ('N°','Date','Client','Articles','Total','Livraison','Statut')
        style.configure('Taf.Treeview', font=FONT_BODY, rowheight=32, background='white',
                        fieldbackground='white', foreground=C['text'])
        style.configure('Taf.Treeview.Heading', font=FONT_SMALL, background=C['bg'], foreground=C['text3'])
        style.map('Taf.Treeview', background=[('selected',C['be1'])], foreground=[('selected',C['text'])])
        self.tree = ttk.Treeview(hist_f, columns=cols_h, show='headings',
                                  style='Taf.Treeview', selectmode='browse')
        for col, w in zip(cols_h, [80,90,140,260,110,100,100]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=w, minwidth=60, anchor='e' if col=='Total' else 'w')
        vsb = ttk.Scrollbar(hist_f, orient='vertical', command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right', fill='y'); self.tree.pack(fill='both', expand=True)
        acts = tk.Frame(hist_f, bg=C['be1'], padx=12, pady=8); acts.pack(fill='x')
        make_btn(acts,'✏️ Modifier',   self._edit_selected, bg=C['be1'], fg=C['primary']).pack(side='left', padx=4)
        make_btn(acts,'🗑️ Supprimer', self._del_selected,  bg=C['danger_bg'], fg=C['danger']).pack(side='left')

        # Barre de statut
        self.status_var = tk.StringVar(value='Prêt')
        tk.Label(self, textvariable=self.status_var, font=FONT_SMALL, fg='white',
                 bg=C['primary'], anchor='w', padx=16, pady=5).pack(fill='x', side='bottom')

    def _refresh(self):
        cmds = self.data.get('commandes', [])
        cols_def = [
            ('🔵 En cours',  'en_cours',  C['info']),
            ('🟢 Confirmée', 'confirmée', C['ok']),
            ('✅ Livrée',    'livrée',    '#558B2F'),
            ('❌ Annulée',   'annulée',   C['danger']),
        ]
        # Stats
        for w in self.stat_frame.winfo_children(): w.destroy()
        for i, (label, key, color) in enumerate(cols_def):
            count = len([c for c in cmds if c.get('statut') == key])
            total = sum(c.get('total',0) for c in cmds if c.get('statut') == key)
            StatCard(self.stat_frame, label, count, sub=fmt_mad(total), accent=color
                     ).grid(row=0, column=i, sticky='nsew', padx=6)
            self.stat_frame.columnconfigure(i, weight=1)

        # Kanban
        for w in self.kanban_inner.winfo_children(): w.destroy()
        for label, key, color in cols_def:
            col_f = tk.Frame(self.kanban_inner, bg=C['be1'], padx=10, pady=10, width=240)
            col_f.pack(side='left', fill='y', padx=6, pady=10)
            col_f.pack_propagate(False)
            hdr = tk.Frame(col_f, bg=C['be1']); hdr.pack(fill='x', pady=(0,8))
            tk.Label(hdr, text=label, font=FONT_HEAD, fg=color, bg=C['be1']).pack(side='left')
            filtered = [c for c in cmds if c.get('statut') == key]
            tk.Label(hdr, text=str(len(filtered)), font=('Segoe UI',9,'bold'),
                     fg='white', bg=color, padx=7, pady=1).pack(side='right')
            if not filtered:
                tk.Label(col_f, text='Aucune commande', font=FONT_SMALL,
                         fg=C['text3'], bg=C['be1']).pack(pady=20)
            for cmd in filtered:
                self._make_kcard(col_f, cmd)

        # Historique
        for row in self.tree.get_children(): self.tree.delete(row)
        for cmd in cmds:
            arts = ', '.join(f"{i['name']}×{i['qty']}" for i in cmd.get('items',[]))
            tag  = cmd.get('statut','en_cours')
            self.tree.insert('', 'end', iid=str(cmd['id']),
                             values=(cmd.get('num',''), cmd.get('date',''),
                                     cmd.get('client',''), arts,
                                     fmt_mad(cmd.get('total',0)),
                                     cmd.get('livraison',''), cmd.get('statut','')),
                             tags=(tag,))
        for key, (bg, fg) in STATUT_COLORS.items():
            self.tree.tag_configure(key, background=bg, foreground=fg)

    def _make_kcard(self, parent, cmd):
        card = tk.Frame(parent, bg=C['card'],
                        highlightbackground=C['border'], highlightthickness=1, padx=10, pady=8)
        card.pack(fill='x', pady=4)
        cid = cmd['id']
        tk.Label(card, text=cmd.get('num',''), font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')
        tk.Label(card, text=f"👤 {cmd.get('client','')}", font=FONT_HEAD, fg=C['text'], bg=C['card']).pack(anchor='w')
        tk.Label(card, text=f"🚚 {cmd.get('livraison','—')}", font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')
        arts = ', '.join(f"{i['name']}×{i['qty']}" for i in cmd.get('items',[]))
        tk.Label(card, text=arts, font=FONT_SMALL, fg=C['text3'], bg=C['card'],
                 wraplength=200, justify='left').pack(anchor='w')
        tk.Label(card, text=fmt_mad(cmd.get('total',0)), font=('Georgia',12,'bold'),
                 fg=C['gold'], bg=C['card']).pack(anchor='w', pady=(4,4))
        btns = tk.Frame(card, bg=C['card']); btns.pack(anchor='w')
        make_btn(btns,'✏️', lambda c=cid: self._edit_commande(c),
                 bg=C['be1'], fg=C['primary']).pack(side='left', padx=(0,4))
        make_btn(btns,'🗑️', lambda c=cid: self._del_commande(c),
                 bg=C['danger_bg'], fg=C['danger']).pack(side='left')

    def _reload(self):
        self.data = load_data(); self._refresh(); self._set_status('✅ Données rechargées')

    def _new_commande(self):
        dlg = CommandeDialog(self, self.data)
        self.wait_window(dlg)
        if dlg.result:
            self.data.setdefault('commandes',[]).append(dlg.result)
            if save_data(self.data):
                self._refresh(); self._set_status('✅ Commande enregistrée')

    def _edit_selected(self):
        sel = self.tree.selection()
        if not sel: messagebox.showinfo('Info','Sélectionnez une commande.'); return
        self._edit_commande(int(sel[0]))

    def _edit_commande(self, cid):
        cmd = next((c for c in self.data.get('commandes',[]) if c['id']==cid), None)
        if not cmd: return
        dlg = CommandeDialog(self, self.data, cmd)
        self.wait_window(dlg)
        if dlg.result:
            self.data['commandes'] = [dlg.result if c['id']==cid else c for c in self.data['commandes']]
            if save_data(self.data):
                self._refresh(); self._set_status('✅ Commande modifiée')

    def _del_selected(self):
        sel = self.tree.selection()
        if not sel: messagebox.showinfo('Info','Sélectionnez une commande.'); return
        self._del_commande(int(sel[0]))

    def _del_commande(self, cid):
        if messagebox.askyesno('Supprimer','Supprimer cette commande ?'):
            self.data['commandes'] = [c for c in self.data.get('commandes',[]) if c['id']!=cid]
            if save_data(self.data):
                self._refresh(); self._set_status('🗑️ Commande supprimée')

    def _set_status(self, msg):
        self.status_var.set(msg)
        self.after(3000, lambda: self.status_var.set('Prêt'))

if __name__ == '__main__':
    CommandesApp().mainloop()
