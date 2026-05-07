// ════════════════════════════════════════════════
// COOP TAFERNOUT — Clients & Créances
//
// Gère la liste des clients et les créances.
// Cette page permet d'ajouter/modifier/supprimer des clients,
// d'enregistrer des paiements et de suivre les montants dus.
// Les clients portent le champ credit et sont liés aux ventes si nécessaire.
// ════════════════════════════════════════════════

const { useState: useStateClients } = React;

function Clients({ data, updateData }) {
  const [tab,   setTab]   = useStateClients('clients');
  const [showP, setShowP] = useStateClients(false);
  const [edit,  setEdit]  = useStateClients(null);
  const [form,  setForm]  = useStateClients({ name:'', phone:'', notes:'' });
  const [payM,  setPayM]  = useStateClients(null);
  const [pa,    setPa]    = useStateClients('');
  const [toast, setToast] = useStateClients(null);
  const [err,   setErr]   = useStateClients('');

  const open = (c=null) => {
    setErr('');
    setEdit(c);
    setForm(c ? {name:c.name,phone:c.phone||'',notes:c.notes||''} : {name:'',phone:'',notes:''});
    setShowP(true);
  };

  const save = () => {
    if (!form.name)  { setErr('Le nom est obligatoire.'); return; }
    if (!form.phone) { setErr('Le téléphone est obligatoire.'); return; }
    setErr('');
    if (edit) {
      updateData('clients', data.clients.map(c=>c.id===edit.id?{...c,...form}:c));
      updateData('sales',   data.sales.map(s=>s.clientId===edit.id?{...s,client:form.name}:s));
    } else {
      updateData('clients', [...data.clients, {...form, id:Date.now(), credit:0}]);
    }
    setToast('✅ Client enregistré');
    setShowP(false);
  };

  const del = id => {
    if (window.confirm('Supprimer ce client et ses données ?')) {
      updateData('clients', data.clients.filter(c=>c.id!==id));
      setToast('🗑️ Client supprimé');
    }
  };

  const pay = (cl, amt) => {
    const a = parseFloat(amt)||0;
    if (a<=0||a>cl.credit) return;
    updateData('clients', data.clients.map(c=>c.id===cl.id?{...c,credit:Math.max(0,+(c.credit-a).toFixed(2))}:c));
    setToast('✅ Paiement enregistré');
    setPayM(null); setPa('');
  };

  const dbt = data.clients.filter(c=>c.credit>0);
  const tcr = dbt.reduce((a,c)=>a+c.credit,0);

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      <div className="tabs">
        <div className={'tab '+(tab==='clients'?'active':'')} onClick={()=>setTab('clients')}>
          👥 Clients ({data.clients.length})
        </div>
        <div className={'tab '+(tab==='creances'?'active':'')} onClick={()=>setTab('creances')}>
          🧾 Créances {dbt.length>0&&<span className="badge br" style={{marginLeft:6}}>{dbt.length}</span>}
        </div>
      </div>

      {tab==='clients' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
            <button className="btn btn-p" onClick={()=>open()}>➕ Nouveau client</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>📞 Téléphone</th><th>💳 Crédit</th><th>Notes</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.clients.map(c=>(
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.phone}</td>
                      <td>{c.credit>0?<span className="badge br">{fmt(c.credit)}</span>:<span className="badge bg">✅ Soldé</span>}</td>
                      <td style={{ color:'var(--tx3)', fontSize:'0.8rem' }}>{c.notes||'—'}</td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        <button className="btn btn-sm btn-s" style={{ marginRight:4 }} onClick={()=>open(c)}>✏️</button>
                        {c.credit>0&&<button className="btn btn-sm btn-ok" style={{ marginRight:4 }} onClick={()=>{setPayM(c);setPa('');}}>💳</button>}
                        <button className="btn btn-sm btn-d" onClick={()=>del(c.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab==='creances' && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns:'repeat(2,1fr)', marginBottom:'1.5rem' }}>
            <div className="sc r"><div className="sl">💸 Total créances</div><div className="sv">{fmtN(tcr)} MAD</div></div>
            <div className="sc o"><div className="sl">👥 Clients débiteurs</div><div className="sv">{dbt.length}</div></div>
          </div>
          <div className="card">
            {!dbt.length
              ? <div className="empty"><span className="ei">✅</span>Aucune créance</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th>Client</th><th>📞</th><th>💰 Montant dû</th><th>Notes</th><th>Action</th></tr></thead>
                    <tbody>
                      {dbt.map(c=>(
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong></td>
                          <td>{c.phone}</td>
                          <td style={{ fontWeight:700, color:'var(--ng)', fontSize:'1rem' }}>{fmt(c.credit)}</td>
                          <td style={{ color:'var(--tx3)', fontSize:'0.82rem' }}>{c.notes||'—'}</td>
                          <td style={{ whiteSpace:'nowrap' }}>
                            <button className="btn btn-sm btn-ok" style={{ marginRight:4 }} onClick={()=>{setPayM(c);setPa(String(c.credit));}}>✅ Tout</button>
                            <button className="btn btn-sm btn-s" onClick={()=>{setPayM(c);setPa('');}}>💳 Partiel</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        </>
      )}

      {showP && (
        <Panel title={edit?'✏️ Modifier client':'👤 Nouveau client'} onClose={()=>setShowP(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          {err && <div className="al al-d" style={{ marginBottom:'1rem' }}>⚠️ {err}</div>}
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>👤 Nom complet *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Prénom Nom"/>
            </div>
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>📞 Téléphone *</label>
              <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06XXXXXXXX"/>
            </div>
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>📝 Notes</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Informations supplémentaires..."/>
            </div>
          </div>
        </Panel>
      )}

      {payM && (
        <Panel title="💳 Encaisser créance" onClose={()=>setPayM(null)}
          footer={<><button className="btn btn-s" onClick={()=>setPayM(null)}>Annuler</button><button className="btn btn-p" onClick={()=>pay(payM,pa)}>💳 Valider</button></>}>
          <div className="al al-w" style={{ marginBottom:'1rem' }}>
            👤 <strong>{payM.name}</strong> — Doit : <strong>{fmt(payM.credit)}</strong>
          </div>
          <div className="fgp">
            <label>💰 Montant (MAD)</label>
            <input type="number" value={pa} onChange={e=>setPa(e.target.value)} min="0" max={payM.credit}/>
          </div>
          {pa&&parseFloat(pa)>0&&parseFloat(pa)<=payM.credit&&(
            <div className="al al-ok">Reste : <strong>{fmt(payM.credit-parseFloat(pa))}</strong></div>
          )}
        </Panel>
      )}
    </div>
  );
}
