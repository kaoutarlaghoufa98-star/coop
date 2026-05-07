// ════════════════════════════════════════════════
// COOP TAFERNOUT — Gestion des utilisateurs
//
// Gère les comptes d'accès au système et leurs permissions.
// Chaque utilisateur peut se voir attribuer un rôle et l'accès
// aux pages disponibles dans AppShell.
// ════════════════════════════════════════════════

const { useState: useStateUsers } = React;

const MODS = [
  { key:'dashboard',  label:'📊 Tableau de bord' },
  { key:'pos',        label:'🛒 Point de Vente'   },
  { key:'products',   label:'🎂 Produits'          },
  { key:'clients',    label:'👥 Clients & Créances'},
  { key:'stock',      label:'📦 Stock Matières'    },
  { key:'charges',    label:'💸 Charges & Pertes'  },
  { key:'invoices',   label:'🧾 Factures'          },
  { key:'personnel',  label:'👤 Personnel'         },
  { key:'commandes',  label:'📋 Commandes'         },
  { key:'users',      label:'🔑 Utilisateurs'      },
  { key:'parametres', label:'⚙️ Paramètres'        },
];

const DEFAULT_PERMS = { dashboard:true, pos:true, products:false, clients:false, stock:false, charges:false, invoices:false, personnel:false, commandes:false, users:false, parametres:false };

function Users({ data, updateData, currentUser }) {
  const [showP, setShowP] = useStateUsers(false);
  const [edit,  setEdit]  = useStateUsers(null);
  const [toast, setToast] = useStateUsers(null);
  const [form,  setForm]  = useStateUsers({ name:'', username:'', password:'', role:'', permissions: { ...DEFAULT_PERMS } });

  const open = (u = null) => {
    setEdit(u);
    setForm(u
      ? { ...u, password:'' }
      : { name:'', username:'', password:'', role:'', permissions: { ...DEFAULT_PERMS } }
    );
    setShowP(true);
  };

  const tgl  = key => setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  const save = () => {
    if (!form.name || !form.username) return;
    if (!edit && !form.password) { alert('Mot de passe requis'); return; }
    const u = { ...form };
    if (edit) {
      if (!u.password) u.password = edit.password;
      updateData('users', data.users.map(x => x.id === edit.id ? { ...x, ...u } : x));
    } else {
      updateData('users', [...data.users, { ...u, id: Date.now() }]);
    }
    setToast('✅ Utilisateur enregistré');
    setShowP(false);
  };

  const del = id => {
    if (id === currentUser.id) { alert('Impossible de supprimer votre propre compte'); return; }
    if (window.confirm('Supprimer ?')) {
      updateData('users', data.users.filter(u => u.id !== id));
      setToast('🗑️ Supprimé');
    }
  };

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem' }}>
        <button className="btn btn-p" onClick={() => open()}>➕ Nouvel utilisateur</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>👤 Nom</th><th>🔑 Login</th><th>💼 Rôle</th><th>Permissions</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === currentUser.id && <span className="badge bn" style={{ marginLeft:8 }}>Vous</span>}
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:'0.88rem' }}>{u.username}</td>
                  <td>{u.role}</td>
                  <td style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>
                    {MODS.filter(m => u.permissions?.[m.key]).map(m => m.label).join(' · ') || 'Aucune'}
                  </td>
                  <td style={{ whiteSpace:'nowrap' }}>
                    <button className="btn btn-sm btn-s" style={{ marginRight:4 }} onClick={() => open(u)}>✏️</button>
                    {u.id !== currentUser.id && <button className="btn btn-sm btn-d" onClick={() => del(u.id)}>🗑️</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel : ajouter/modifier utilisateur */}
      {showP && (
        <Panel title={edit ? '✏️ Modifier utilisateur' : '➕ Nouvel utilisateur'} onClose={() => setShowP(false)}
          footer={<><button className="btn btn-s" onClick={() => setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}><label>👤 Nom complet *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} placeholder="Prénom Nom"/></div>
            <div className="fgp"><label>🔑 Identifiant *</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username:e.target.value }))} placeholder="ex: fatima"/></div>
            <div className="fgp">
              <label>🔒 Mot de passe {edit && <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(vide=inchangé)</span>}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password:e.target.value }))} placeholder={edit ? '••••••••' : 'Nouveau mot de passe'}/>
            </div>
            <div className="fgp" style={{ gridColumn:'span 2' }}><label>💼 Rôle</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role:e.target.value }))} placeholder="Ex: Vendeuse, Comptable..."/></div>
          </div>
          <div style={{ marginTop:'1rem' }}>
            <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--br7)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>
              🔒 Permissions d'accès
            </div>
            <div style={{ background:'var(--be0)', borderRadius:10, padding:'0.5rem 1rem' }}>
              {MODS.map(m => (
                <div key={m.key} className="ptgl">
                  <span style={{ fontSize:'0.88rem' }}>{m.label}</span>
                  <button className={'tgl ' + (form.permissions[m.key] ? 'on' : 'off')} onClick={() => tgl(m.key)}></button>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
