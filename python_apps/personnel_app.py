#!/usr/bin/env python3
# ════════════════════════════════════════════════════════════════
# COOP TAFERNOUT — Application Personnel (Python / tkinter)
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
    'warn_bg':'#FFF3E0', 'br2':'#E8BF9A', 'br8':'#3D2314',
}
FONT_TITLE = ('Georgia', 15, 'bold')
FONT_HEAD  = ('Segoe UI', 10, 'bold')
FONT_BODY  = ('Segoe UI', 10)
FONT_SMALL = ('Segoe UI', 9)

POSTES  = ['Pâtissier chef','Vendeuse','Apprentie','Livreur','Gérant',
           'Comptable','Responsable Stock','Caissier','Autre']
STATUTS = ['actif', 'congé', 'inactif']

def load_data():
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Erreur : {e}")
    return {'employees': [], 'appSettings': {}}

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

def initials(name):
    parts = name.strip().split()
    return ''.join(p[0].upper() for p in parts[:2]) if parts else '?'

def anciennete(start_date):
    try:
        d = datetime.strptime(start_date, '%Y-%m-%d')
        delta = datetime.now() - d
        ans   = delta.days // 365
        mois  = (delta.days % 365) // 30
        return f"{ans}a {mois}m"
    except:
        return start_date or '—'

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
# DIALOGUE — Nouvel / Modifier employé
# ══════════════════════════════════════════════════════════════════

class EmployeDialog(tk.Toplevel):
    def __init__(self, parent, employe=None):
        super().__init__(parent)
        self.result  = None
        self.employe = employe
        self.title('✏️ Modifier employé' if employe else '👤 Nouvel employé')
        self.configure(bg=C['bg'])
        self.resizable(False, False)
        self.grab_set()
        self.transient(parent)
        self._build()
        w, h = 540, 600
        x = parent.winfo_rootx() + (parent.winfo_width() - w) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - h) // 2
        self.geometry(f'{w}x{h}+{x}+{y}')

    def _build(self):
        e = self.employe

        # En-tête
        hd = tk.Frame(self, bg=C['be1'], padx=20, pady=14); hd.pack(fill='x')
        tk.Label(hd, text='✏️ Modifier employé' if e else '👤 Nouvel employé',
                 font=FONT_TITLE, fg=C['primary'], bg=C['be1']).pack(anchor='w')
        tk.Frame(hd, bg=C['border'], height=1).pack(fill='x', pady=(8,0))

        body = tk.Frame(self, bg=C['bg'], padx=20, pady=16); body.pack(fill='both', expand=True)

        def field(lbl, widget_fn):
            f = tk.Frame(body, bg=C['bg']); f.pack(fill='x', pady=5)
            tk.Label(f, text=lbl, font=FONT_SMALL, fg=C['primary'],
                     bg=C['bg'], width=22, anchor='w').pack(side='left')
            w = widget_fn(f); w.pack(side='left', fill='x', expand=True)
            return w

        self.v_name      = tk.StringVar(value=e['name']         if e else '')
        self.v_role      = tk.StringVar(value=e['role']         if e else '')
        self.v_salary    = tk.StringVar(value=str(e['salary'])  if e else '')
        self.v_daily     = tk.StringVar(value=str(e.get('dailyRate',0)) if e else '')
        self.v_workdays  = tk.StringVar(value=str(e.get('workDays',25)) if e else '25')
        self.v_phone     = tk.StringVar(value=e.get('phone','') if e else '')
        self.v_startdate = tk.StringVar(value=e.get('startDate','') if e else today())
        self.v_status    = tk.StringVar(value=e.get('status','actif') if e else 'actif')

        field('👤 Nom complet *',         lambda p: tk.Entry(p, textvariable=self.v_name, font=FONT_BODY, relief='solid', bd=1))
        field('💼 Poste *',               lambda p: ttk.Combobox(p, textvariable=self.v_role, values=POSTES, font=FONT_BODY))
        field('💰 Salaire mensuel (MAD)', lambda p: tk.Entry(p, textvariable=self.v_salary, font=FONT_BODY, relief='solid', bd=1))
        field('📅 Salaire / Jour (MAD)',  lambda p: tk.Entry(p, textvariable=self.v_daily, font=FONT_BODY, relief='solid', bd=1))
        field('📆 Jours travaillés/mois', lambda p: tk.Entry(p, textvariable=self.v_workdays, font=FONT_BODY, relief='solid', bd=1))
        field('📞 Téléphone',             lambda p: tk.Entry(p, textvariable=self.v_phone, font=FONT_BODY, relief='solid', bd=1))
        field("📅 Date d'embauche",       lambda p: tk.Entry(p, textvariable=self.v_startdate, font=FONT_BODY, relief='solid', bd=1))
        field('🏷️ Statut',               lambda p: ttk.Combobox(p, textvariable=self.v_status, values=STATUTS, font=FONT_BODY, state='readonly'))

        # Aperçu salaire calculé
        self.calc_label = tk.Label(body, text='', font=FONT_BODY, fg=C['ok'],
                                    bg=C['ok_bg'], padx=10, pady=6, relief='flat')
        self.calc_label.pack(fill='x', pady=(6,0))
        self.v_daily.trace('w', lambda *a: self._update_calc())
        self.v_workdays.trace('w', lambda *a: self._update_calc())
        self._update_calc()

        ft = tk.Frame(self, bg=C['be1'], padx=20, pady=10); ft.pack(fill='x', side='bottom')
        tk.Frame(ft, bg=C['border'], height=1).pack(fill='x', pady=(0,8))
        make_btn(ft,'💾 Enregistrer', self._save).pack(side='right', padx=4)
        make_btn(ft,'Annuler', self.destroy, bg=C['be1'], fg=C['primary']).pack(side='right')

    def _update_calc(self):
        try:
            daily    = float(self.v_daily.get() or 0)
            workdays = float(self.v_workdays.get() or 0)
            total    = daily * workdays
            self.calc_label.config(
                text=f'💰 Salaire calculé : {fmt_mad(total)}  ({workdays:.0f} j × {daily:.0f} MAD/j)',
                bg=C['ok_bg'], fg=C['ok'])
        except:
            self.calc_label.config(text='', bg=C['bg'])

    def _save(self):
        name = self.v_name.get().strip()
        role = self.v_role.get().strip()
        if not name or not role:
            messagebox.showwarning('Champs requis', 'Nom et poste sont obligatoires.', parent=self); return
        try:    salary = float(self.v_salary.get() or 0)
        except: salary = 0
        try:    daily  = float(self.v_daily.get() or 0)
        except: daily  = round(salary / 26) if salary else 0
        try:    wdays  = int(self.v_workdays.get() or 25)
        except: wdays  = 25

        self.result = {
            'id':        self.employe['id'] if self.employe else int(datetime.now().timestamp()*1000),
            'name':      name,
            'role':      role,
            'salary':    salary,
            'dailyRate': daily,
            'workDays':  wdays,
            'phone':     self.v_phone.get().strip(),
            'startDate': self.v_startdate.get().strip(),
            'status':    self.v_status.get(),
        }
        self.destroy()

# ══════════════════════════════════════════════════════════════════
# CARTE EMPLOYÉ (vue équipe)
# ══════════════════════════════════════════════════════════════════

class EmployeCard(tk.Frame):
    def __init__(self, parent, emp, on_edit, on_del):
        super().__init__(parent, bg=C['card'],
                         highlightbackground=C['border'], highlightthickness=1,
                         padx=14, pady=12)
        # Avatar (initiales)
        av_f = tk.Frame(self, bg=C['br2'], width=50, height=50); av_f.pack_propagate(False)
        av_f.pack(side='left', anchor='n', padx=(0,12))
        tk.Label(av_f, text=initials(emp['name']), font=('Georgia',14,'bold'),
                 fg=C['br8'], bg=C['br2']).place(relx=0.5, rely=0.5, anchor='center')

        # Infos
        right = tk.Frame(self, bg=C['card']); right.pack(side='left', fill='both', expand=True)

        # Nom + badge statut
        top = tk.Frame(right, bg=C['card']); top.pack(fill='x')
        tk.Label(top, text=emp['name'], font=FONT_HEAD, fg=C['text'], bg=C['card']).pack(side='left')
        st_colors = {'actif': (C['ok_bg'],C['ok']), 'congé':(C['warn_bg'],C['warn']), 'inactif':(C['danger_bg'],C['danger'])}
        bg_s, fg_s = st_colors.get(emp.get('status','actif'), (C['be1'],C['text3']))
        tk.Label(top, text=emp.get('status','actif'), font=FONT_SMALL,
                 bg=bg_s, fg=fg_s, padx=8, pady=2).pack(side='right')

        tk.Label(right, text=emp.get('role',''), font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')

        # Salaire
        sal_f = tk.Frame(right, bg=C['be1']); sal_f.pack(fill='x', pady=(6,4))
        tk.Label(sal_f, text='Salaire mensuel', font=FONT_SMALL, fg=C['text3'], bg=C['be1'], padx=10, pady=4).pack(side='left')
        dr = emp.get('dailyRate') or round(emp.get('salary',0)/26)
        tk.Label(sal_f, text=fmt_mad(emp.get('salary',0)), font=('Georgia',12,'bold'),
                 fg=C['br8'], bg=C['be1'], padx=10).pack(side='left')
        tk.Label(sal_f, text=f"📅 {fmt_mad(dr)}/j", font=FONT_SMALL,
                 fg=C['primary'], bg=C['be1'], padx=6).pack(side='right')

        tk.Label(right, text=f"📞 {emp.get('phone','—')}   🗓️ {anciennete(emp.get('startDate',''))}",
                 font=FONT_SMALL, fg=C['text3'], bg=C['card']).pack(anchor='w')

        # Boutons
        btns = tk.Frame(right, bg=C['card']); btns.pack(anchor='w', pady=(6,0))
        eid = emp['id']
        make_btn(btns,'✏️ Modifier', lambda e=eid: on_edit(e), bg=C['be1'], fg=C['primary']).pack(side='left', padx=(0,6))
        make_btn(btns,'🗑️',         lambda e=eid: on_del(e),  bg=C['danger_bg'], fg=C['danger']).pack(side='left')

# ══════════════════════════════════════════════════════════════════
# FENÊTRE PRINCIPALE — Personnel
# ══════════════════════════════════════════════════════════════════

class PersonnelApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.data = load_data()
        s = self.data.get('appSettings', {})
        self.title(f"👤 Personnel — {s.get('name','Coop Tafernout')}")
        self.geometry('1200x740'); self.minsize(900,600)
        self.configure(bg=C['bg'])
        self._build_ui()
        self._refresh()

    def _build_ui(self):
        # En-tête
        hd = tk.Frame(self, bg=C['card'], highlightbackground=C['border'], highlightthickness=1)
        hd.pack(fill='x')
        ih = tk.Frame(hd, bg=C['card'], padx=24, pady=14); ih.pack(fill='x')
        tk.Label(ih, text='👤', font=('Segoe UI',22), fg=C['primary'], bg=C['card']).pack(side='left')
        tk.Label(ih, text='Gestion du Personnel', font=FONT_TITLE, fg=C['primary'], bg=C['card']).pack(side='left', padx=10)
        make_btn(ih,'🔄', self._reload, bg=C['be1'], fg=C['primary']).pack(side='right', padx=4)
        make_btn(ih,'➕ Nouvel employé', self._new_employe).pack(side='right', padx=4)

        body = tk.Frame(self, bg=C['bg'], padx=20, pady=16); body.pack(fill='both', expand=True)

        # Cartes stats
        self.stat_frame = tk.Frame(body, bg=C['bg']); self.stat_frame.pack(fill='x', pady=(0,16))

        # Onglets
        style = ttk.Style()
        style.configure('Taf.TNotebook', background=C['bg'])
        style.configure('Taf.TNotebook.Tab', padding=[14,8], font=FONT_HEAD)
        style.map('Taf.TNotebook.Tab', background=[('selected',C['card'])], foreground=[('selected',C['primary'])])
        self.notebook = ttk.Notebook(body, style='Taf.TNotebook'); self.notebook.pack(fill='both', expand=True)

        # ── Onglet Équipe (cartes visuelles) ──
        equipe_outer = tk.Frame(self.notebook, bg=C['card']); self.notebook.add(equipe_outer, text='👤 Équipe')
        self.equipe_canvas = tk.Canvas(equipe_outer, bg=C['card'], highlightthickness=0)
        eq_vsb = ttk.Scrollbar(equipe_outer, orient='vertical', command=self.equipe_canvas.yview)
        self.equipe_canvas.configure(yscrollcommand=eq_vsb.set)
        eq_vsb.pack(side='right', fill='y'); self.equipe_canvas.pack(fill='both', expand=True)
        self.equipe_inner = tk.Frame(self.equipe_canvas, bg=C['card'], padx=16, pady=14)
        self.equipe_canvas.create_window((0,0), window=self.equipe_inner, anchor='nw')
        self.equipe_inner.bind('<Configure>', lambda e: self.equipe_canvas.configure(
            scrollregion=self.equipe_canvas.bbox('all')))

        # ── Onglet Tableau de paie ──
        paie_f = tk.Frame(self.notebook, bg=C['card']); self.notebook.add(paie_f, text='💰 Tableau de paie')
        style.configure('Taf.Treeview', font=FONT_BODY, rowheight=32, background='white',
                        fieldbackground='white', foreground=C['text'])
        style.configure('Taf.Treeview.Heading', font=FONT_SMALL, background=C['bg'], foreground=C['text3'])
        style.map('Taf.Treeview', background=[('selected',C['be1'])], foreground=[('selected',C['text'])])

        cols_p = ('Employé','Poste','Jours','Taux/Jour','Salaire mensuel','Statut')
        self.tree_paie = ttk.Treeview(paie_f, columns=cols_p, show='headings',
                                       style='Taf.Treeview', selectmode='browse')
        for col, w in zip(cols_p, [180, 140, 70, 110, 140, 90]):
            self.tree_paie.heading(col, text=col)
            self.tree_paie.column(col, width=w, minwidth=50,
                                   anchor='e' if col in ('Taux/Jour','Salaire mensuel') else 'c' if col=='Jours' else 'w')
        vsb_p = ttk.Scrollbar(paie_f, orient='vertical', command=self.tree_paie.yview)
        self.tree_paie.configure(yscrollcommand=vsb_p.set)
        vsb_p.pack(side='right', fill='y'); self.tree_paie.pack(fill='both', expand=True)

        # Pied tableau paie
        self.paie_total_frame = tk.Frame(paie_f, bg=C['be1'], padx=16, pady=10)
        self.paie_total_frame.pack(fill='x')

        # Barre de statut
        self.status_var = tk.StringVar(value='Prêt')
        tk.Label(self, textvariable=self.status_var, font=FONT_SMALL, fg='white',
                 bg=C['primary'], anchor='w', padx=16, pady=5).pack(fill='x', side='bottom')

    def _refresh(self):
        employes = self.data.get('employees', [])
        actifs   = [e for e in employes if e.get('status') == 'actif']
        conges   = [e for e in employes if e.get('status') == 'congé']
        total_sal= sum(e.get('salary',0) for e in actifs)

        # Stats
        for w in self.stat_frame.winfo_children(): w.destroy()
        cards_data = [
            ('👥 Effectif total',     len(employes),    f'{len(actifs)} actifs',   C['info']),
            ('✅ Actifs',             len(actifs),      'Employés en service',      C['ok']),
            ('🏖️ En congé',          len(conges),      '',                         C['warn']),
            ('💸 Masse salariale',    fmt_mad(total_sal),'Par mois',               C['primary']),
        ]
        for i, (label, value, sub, color) in enumerate(cards_data):
            StatCard(self.stat_frame, label, value, sub=sub, accent=color
                     ).grid(row=0, column=i, sticky='nsew', padx=6)
            self.stat_frame.columnconfigure(i, weight=1)

        # Équipe (grille 3 colonnes)
        for w in self.equipe_inner.winfo_children(): w.destroy()
        COLS = 3
        for i, emp in enumerate(employes):
            row, col = divmod(i, COLS)
            card = EmployeCard(self.equipe_inner, emp, self._edit_employe, self._del_employe)
            card.grid(row=row, column=col, sticky='nsew', padx=8, pady=6)
            self.equipe_inner.columnconfigure(col, weight=1)

        # Tableau de paie
        for row in self.tree_paie.get_children(): self.tree_paie.delete(row)
        for emp in employes:
            dr  = emp.get('dailyRate') or round(emp.get('salary',0)/26)
            tag = emp.get('status','actif')
            self.tree_paie.insert('', 'end', iid=str(emp['id']),
                                  values=(emp['name'], emp.get('role',''),
                                          f"{emp.get('workDays',25)} j",
                                          fmt_mad(dr),
                                          fmt_mad(emp.get('salary',0)),
                                          emp.get('status','actif')),
                                  tags=(tag,))
        self.tree_paie.tag_configure('actif',   foreground=C['ok'])
        self.tree_paie.tag_configure('congé',   foreground=C['warn'], background=C['warn_bg'])
        self.tree_paie.tag_configure('inactif', foreground=C['danger'], background=C['danger_bg'])

        # Ligne total
        for w in self.paie_total_frame.winfo_children(): w.destroy()
        tk.Label(self.paie_total_frame, text=f'TOTAL MASSE SALARIALE MENSUELLE : {fmt_mad(total_sal)}',
                 font=('Georgia',13,'bold'), fg=C['br8'], bg=C['be1']).pack(side='right', padx=8)

    def _reload(self):
        self.data = load_data(); self._refresh(); self._set_status('✅ Données rechargées')

    def _new_employe(self):
        dlg = EmployeDialog(self)
        self.wait_window(dlg)
        if dlg.result:
            self.data.setdefault('employees',[]).append(dlg.result)
            if save_data(self.data):
                self._refresh(); self._set_status('✅ Employé ajouté')

    def _edit_employe(self, eid):
        emp = next((e for e in self.data.get('employees',[]) if e['id']==eid), None)
        if not emp: return
        dlg = EmployeDialog(self, emp)
        self.wait_window(dlg)
        if dlg.result:
            self.data['employees'] = [dlg.result if e['id']==eid else e for e in self.data['employees']]
            if save_data(self.data):
                self._refresh(); self._set_status('✅ Employé modifié')

    def _del_employe(self, eid):
        emp = next((e for e in self.data.get('employees',[]) if e['id']==eid), None)
        if emp and messagebox.askyesno('Supprimer', f'Supprimer {emp["name"]} ?'):
            self.data['employees'] = [e for e in self.data.get('employees',[]) if e['id']!=eid]
            if save_data(self.data):
                self._refresh(); self._set_status('🗑️ Employé supprimé')

    def _set_status(self, msg):
        self.status_var.set(msg)
        self.after(3000, lambda: self.status_var.set('Prêt'))

if __name__ == '__main__':
    PersonnelApp().mainloop()
