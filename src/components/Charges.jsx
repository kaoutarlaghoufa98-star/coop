// ════════════════════════════════════════════════
// COOP TAFERNOUT — Charges & Pertes
//
// Permet d'enregistrer les charges et les pertes.
// La page affiche un rapport mensuel, le total par catégorie
// et le statut de paiement. Les pertes sont comptées comme des charges.
// ════════════════════════════════════════════════

const { useState: useStateCharges } = React;

function Charges({ data, updateData }) {
  const [showP, setShowP] = useStateCharges(false);
  const [form,  setForm]  = useStateCharges({ date:'', label:'', category:'', type:'charge', amount:'', supplier:'', paid:false });
  const [toast, setToast] = useStateCharges(null);
  const [mois,  setMois]  = useStateCharges(() => new Date().toISOString().slice(0,7)); // YYYY-MM

  const cats = ['Loyer','Matières premières','Énergie','Emballages','Personnel','Maintenance','Transport','Production','Autres'];

  // Filtrage mensuel
  const chargesM = data.charges.filter(c => {
    const d = c.date || '';
    return d.startsWith(mois);
  });

  const save = () => {
    if (!form.label || !form.amount) return;
    const entry = { ...form, id:Date.now(), amount:parseFloat(form.amount), date:form.date||td() };
    // Si c'est une perte, elle est aussi comptée comme une charge automatiquement
    updateData('charges', [entry, ...data.charges]);
    setToast('✅ ' + (form.type==='perte'?'Perte enregistrée (impact charges automatique)':'Charge enregistrée'));
    setShowP(false);
    setForm({ date:'', label:'', category:'', type:'charge', amount:'', supplier:'', paid:false });
  };

  const togglePaid = id => updateData('charges', data.charges.map(c=>c.id===id?{...c,paid:!c.paid}:c));
  const del = id => { if (window.confirm('Supprimer ?')) { updateData('charges', data.charges.filter(c=>c.id!==id)); setToast('🗑️ Supprimée'); } };

  const tot   = chargesM.reduce((a,c)=>a+c.amount,0);
  const tc    = chargesM.filter(c=>c.type!=='perte').reduce((a,c)=>a+c.amount,0);
  const tp    = chargesM.filter(c=>c.type==='perte').reduce((a,c)=>a+c.amount,0);
  const up    = chargesM.filter(c=>!c.paid).reduce((a,c)=>a+c.amount,0);
  const byCat = [...new Set(chargesM.map(c=>c.category))].filter(Boolean)
    .map(cat=>({ cat, t:chargesM.filter(c=>c.category===cat).reduce((a,c)=>a+c.amount,0) }))
    .sort((a,b)=>b.t-a.t);

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      {/* Sélecteur de mois */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <label style={{ fontWeight:600, color:'var(--br7)', fontSize:'0.85rem' }}>📅 Mois :</label>
        <input type="month" value={mois} onChange={e=>setMois(e.target.value)}
          style={{ padding:'8px 12px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem', background:'white' }}/>
        <button className="btn btn-sm btn-s" onClick={()=>setMois(new Date().toISOString().slice(0,7))}>Ce mois</button>
      </div>

      {/* Alerte : les pertes impactent les charges */}
      {tp > 0 && (
        <div className="al al-d" style={{ marginBottom:'1rem' }}>
          📉 <strong>{fmt(tp)}</strong> de pertes ce mois — déjà incluses dans le total des charges.
        </div>
      )}

      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'1.5rem' }}>
        <div className="sc b"><div className="sl">💸 Total charges + pertes</div><div className="sv">{fmtN(tot)} MAD</div></div>
        <div className="sc o"><div className="sl">📋 Charges nettes</div><div className="sv">{fmtN(tc)} MAD</div></div>
        <div className="sc r"><div className="sl">📉 Pertes</div><div className="sv">{fmtN(tp)} MAD</div></div>
        <div className="sc g"><div className="sl">⏳ Impayées</div><div className="sv">{fmtN(up)} MAD</div></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem', alignItems:'start' }}>
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
            <button className="btn btn-p" onClick={()=>setShowP(true)}>➕ Nouvelle entrée</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>📅 Date</th><th>Libellé</th><th>Type</th><th>Catégorie</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                  {chargesM.map(c=>(
                    <tr key={c.id}>
                      <td style={{ color:'var(--tx3)' }}>{c.date}</td>
                      <td><strong>{c.label}</strong></td>
                      <td><span className={'badge '+(c.type==='perte'?'br':'bb')}>{c.type==='perte'?'📉 Perte':'📋 Charge'}</span></td>
                      <td><span className="chip">{c.category||'—'}</span></td>
                      <td style={{ fontWeight:700, color:'var(--br8)' }}>{fmt(c.amount)}</td>
                      <td><span className={'badge '+(c.paid?'bg':'br')}>{c.paid?'✅ Payé':'⏳ Impayé'}</span></td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        <button className="btn btn-sm btn-s" style={{ marginRight:4 }} onClick={()=>togglePaid(c.id)}>{c.paid?'↩️':'✅'}</button>
                        <button className="btn btn-sm btn-d" onClick={()=>del(c.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {!chargesM.length&&<tr><td colSpan="7" style={{ textAlign:'center', color:'var(--tx3)', padding:'2rem' }}>Aucune entrée ce mois</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stitle">📊 Par catégorie ({mois})</div>
          {byCat.length ? byCat.map(({cat,t})=>(
            <div key={cat} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', marginBottom:4 }}>
                <span style={{ fontWeight:500 }}>{cat}</span>
                <span style={{ fontWeight:700, color:'var(--br7)' }}>{fmtN(t)} MAD</span>
              </div>
              <div className="sbar-w">
                <div className="sbar" style={{ width:(tot>0?(t/tot*100):0)+'%', background:'var(--br4)' }}/>
              </div>
            </div>
          )) : <div style={{ color:'var(--tx3)', fontSize:'0.85rem', padding:'1rem 0' }}>Aucune donnée</div>}
        </div>
      </div>

      {showP && (
        <Panel title="➕ Nouvelle charge / perte" onClose={()=>setShowP(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>

          <div style={{ display:'flex', gap:12, marginBottom:'1.5rem', padding:'1rem', background:'var(--be0)', borderRadius:10 }}>
            <button className={'btn '+(form.type==='charge'?'btn-p':'btn-s')} style={{ flex:1, justifyContent:'center' }} onClick={()=>setForm(f=>({...f,type:'charge'}))}>📋 Charge</button>
            <button className={'btn '+(form.type==='perte' ?'btn-d':'btn-s')} style={{ flex:1, justifyContent:'center' }} onClick={()=>setForm(f=>({...f,type:'perte'}))}>📉 Perte</button>
          </div>

          {form.type==='perte' && (
            <div className="al al-w" style={{ marginBottom:'1rem' }}>
              ⚠️ Toute perte est automatiquement comptabilisée dans les charges du mois.
            </div>
          )}

          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>📝 Libellé *</label>
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder={form.type==='perte'?'Ex: Gâteaux brûlés...':'Ex: Farine premium 100kg'}/>
            </div>
            <div className="fgp">
              <label>🏷️ Catégorie</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                <option value="">— Sélectionner —</option>
                {cats.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fgp">
              <label>📅 Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>
            <div className="fgp">
              <label>💰 Montant (MAD) *</label>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="0"/>
            </div>
            {form.type==='charge' && (
              <div className="fgp">
                <label>🏭 Fournisseur</label>
                <input value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="Nom du fournisseur"/>
              </div>
            )}
            <div className="fgp" style={{ gridColumn:'span 2', display:'flex', alignItems:'center', gap:12 }}>
              <button className={'tgl '+(form.paid?'on':'off')} onClick={()=>setForm(f=>({...f,paid:!f.paid}))}></button>
              <label style={{ marginBottom:0 }}>✅ Déjà payée</label>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
