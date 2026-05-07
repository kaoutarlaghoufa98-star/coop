// ════════════════════════════════════════════════
// COOP TAFERNOUT — Stock matières premières
//
// Gère les matières premières, leur stock actuel et les mouvements.
// On peut ajouter/modifier des matières, enregistrer des entrées/sorties,
// et générer une charge automatique pour les sorties si nécessaire.
// ════════════════════════════════════════════════

const { useState: useStateStock } = React;

function Stock({ data, updateData }) {
  const [showP,  setShowP]  = useStateStock(false);
  const [showM,  setShowM]  = useStateStock(false);
  const [edit,   setEdit]   = useStateStock(null);
  const [toast,  setToast]  = useStateStock(null);
  const [mvt,    setMvt]    = useStateStock({ material:'', type:'sortie', qty:'', unit:'kg', note:'', addToCharges:false, price:'' });
  const [form,   setForm]   = useStateStock({ name:'', unit:'kg', currentStock:'', minStock:'', supplier:'' });

  const mats    = data.rawMaterials || [];
  const rp      = mats.filter(m=>m.currentStock<=0).length;
  const fw      = mats.filter(m=>m.currentStock>0&&m.currentStock<=m.minStock).length;

  // Sorties uniquement, triées par date récente
  const sorties = [...(data.stockMovements||[])].filter(m=>m.type==='sortie').sort((a,b)=>b.date.localeCompare(a.date));

  const open = (m=null) => {
    setEdit(m);
    setForm(m
      ? {name:m.name,unit:m.unit,currentStock:String(m.currentStock),minStock:String(m.minStock),supplier:m.supplier||''}
      : {name:'',unit:'kg',currentStock:'',minStock:'',supplier:''}
    );
    setShowP(true);
  };

  const save = () => {
    if (!form.name) return;
    const item = {...form, currentStock:parseFloat(form.currentStock)||0, minStock:parseFloat(form.minStock)||0, lastUpdated:td()};
    if (edit) updateData('rawMaterials', mats.map(m=>m.id===edit.id?{...m,...item}:m));
    else      updateData('rawMaterials', [...mats, {...item, id:Date.now()}]);
    setToast('✅ Matière enregistrée');
    setShowP(false);
  };

  const del = id => {
    if (window.confirm('Supprimer ?')) {
      updateData('rawMaterials', mats.filter(m=>m.id!==id));
      setToast('🗑️ Supprimé');
    }
  };

  const addMvt = () => {
    if (!mvt.material||!mvt.qty) return;
    const qty = parseFloat(mvt.qty);
    const mat = mats.find(m=>m.name===mvt.material);
    updateData('rawMaterials', mats.map(m=>m.name!==mvt.material?m:{
      ...m,
      currentStock: mvt.type==='entrée'?m.currentStock+qty:Math.max(0,m.currentStock-qty),
      lastUpdated: td()
    }));
    const newMvt = {...mvt, id:Date.now(), date:td(), qty};
    updateData('stockMovements', [newMvt, ...(data.stockMovements||[])]);

    // Ajout automatique aux charges si option cochée et c'est une sortie
    if (mvt.type==='sortie' && mvt.addToCharges && mvt.price) {
      const amount = qty * parseFloat(mvt.price);
      const charge = {
        id: Date.now()+1, date:td(),
        label: `Sortie stock : ${qty} ${mvt.unit} ${mvt.material}`,
        category: 'Matières premières', type:'charge',
        amount, supplier: mat?.supplier||'', paid:true
      };
      updateData('charges', [charge, ...(data.charges||[])]);
    }

    setToast(mvt.addToCharges&&mvt.type==='sortie'?'✅ Sortie enregistrée + ajoutée aux charges':'✅ Mouvement enregistré');
    setShowM(false);
    setMvt({material:'',type:'sortie',qty:'',unit:'kg',note:'',addToCharges:false,price:''});
  };

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.5rem' }}>
        <div className="sc g"><div className="sl">✅ Matières OK</div><div className="sv">{mats.filter(m=>m.currentStock>m.minStock).length}</div></div>
        <div className="sc o"><div className="sl">⚠️ Stock faible</div><div className="sv">{fw}</div></div>
        <div className="sc r"><div className="sl">⛔ Ruptures</div><div className="sv">{rp}</div></div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginBottom:'1.5rem' }}>
        <button className="btn btn-s" onClick={()=>setShowM(true)}>📤 Mouvement stock</button>
        <button className="btn btn-p" onClick={()=>open()}>➕ Nouvelle matière</button>
      </div>

      {/* Grille matières */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {mats.map(m=>{
          const pct = m.minStock>0?Math.min(100,m.currentStock/(m.minStock*2)*100):50;
          const cl  = m.currentStock<=0?'var(--ng)':m.currentStock<=m.minStock?'var(--warn)':'var(--ok)';
          return (
            <div key={m.id} className="card" style={{ padding:'1rem', borderLeft:'3px solid '+cl }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{m.name}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--tx3)' }}>🏭 {m.supplier||'—'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, fontSize:'1.1rem', color:cl }}>{m.currentStock}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--tx3)' }}>{m.unit} · min:{m.minStock}</div>
                </div>
              </div>
              <div className="sbar-w"><div className="sbar" style={{ width:pct+'%', background:cl }}/></div>
              {m.currentStock<=0&&<div style={{ fontSize:'0.72rem', color:'var(--ng)', marginTop:4, fontWeight:600 }}>⛔ RUPTURE</div>}
              {m.currentStock>0&&m.currentStock<=m.minStock&&<div style={{ fontSize:'0.72rem', color:'var(--warn)', marginTop:4, fontWeight:600 }}>⚠️ Stock faible</div>}
              <div style={{ display:'flex', gap:4, marginTop:8 }}>
                <button className="btn btn-sm btn-s" style={{ flex:1 }} onClick={()=>open(m)}>✏️ Modifier</button>
                <button className="btn btn-sm btn-d" onClick={()=>del(m.id)}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sorties uniquement, ordre récent */}
      <div className="card">
        <div className="stitle">📤 Historique des sorties (récent en premier)</div>
        {!sorties.length
          ? <div style={{ color:'var(--tx3)', padding:'1rem', textAlign:'center' }}>Aucune sortie enregistrée</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>📅 Date</th><th>Matière</th><th>Quantité</th><th>Note</th></tr></thead>
                <tbody>
                  {sorties.map(m=>(
                    <tr key={m.id}>
                      <td style={{ color:'var(--tx3)' }}>{m.date}</td>
                      <td><strong>{m.material||m.product}</strong></td>
                      <td style={{ fontWeight:600, color:'var(--ng)' }}>📤 {m.qty} {m.unit}</td>
                      <td style={{ color:'var(--tx3)', fontSize:'0.83rem' }}>{m.note||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Panel : ajouter/modifier matière */}
      {showP && (
        <Panel title={edit?'✏️ Modifier matière':'➕ Nouvelle matière'} onClose={()=>setShowP(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}><label>📦 Nom *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Farine, Beurre..."/></div>
            <div className="fgp"><label>⚖️ Unité</label>
              <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                <option>kg</option><option>g</option><option>litres</option><option>unités</option><option>pièces</option><option>boîtes</option>
              </select>
            </div>
            <div className="fgp"><label>🏭 Fournisseur</label><input value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="Nom fournisseur"/></div>
            <div className="fgp"><label>📊 Stock actuel</label><input type="number" value={form.currentStock} onChange={e=>setForm(f=>({...f,currentStock:e.target.value}))} min="0"/></div>
            <div className="fgp"><label>⚠️ Stock minimum</label><input type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} min="0"/></div>
          </div>
        </Panel>
      )}

      {/* Panel : mouvement de stock */}
      {showM && (
        <Panel title="📦 Nouveau mouvement de stock" onClose={()=>setShowM(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowM(false)}>Annuler</button><button className="btn btn-p" onClick={addMvt}>💾 Enregistrer</button></>}>
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>📦 Matière *</label>
              <input list="mats-l" value={mvt.material} onChange={e=>setMvt(m=>({...m,material:e.target.value}))} placeholder="Nom de la matière"/>
              <datalist id="mats-l">{mats.map(m=><option key={m.id} value={m.name}/>)}</datalist>
            </div>
            <div className="fgp"><label>🔄 Type *</label>
              <select value={mvt.type} onChange={e=>setMvt(m=>({...m,type:e.target.value}))}>
                <option value="sortie">📤 Sortie</option>
                <option value="entrée">📥 Entrée</option>
              </select>
            </div>
            <div className="fgp"><label>🔢 Quantité *</label><input type="number" value={mvt.qty} onChange={e=>setMvt(m=>({...m,qty:e.target.value}))} min="1"/></div>
            <div className="fgp"><label>⚖️ Unité</label>
              <select value={mvt.unit} onChange={e=>setMvt(m=>({...m,unit:e.target.value}))}>
                <option>kg</option><option>g</option><option>unités</option><option>litres</option><option>pièces</option>
              </select>
            </div>
            <div className="fgp" style={{ gridColumn:'span 2' }}><label>📝 Note</label><input value={mvt.note} onChange={e=>setMvt(m=>({...m,note:e.target.value}))} placeholder="Ex: Production du jour..."/></div>

            {mvt.type==='sortie' && (
              <>
                <div className="fgp" style={{ gridColumn:'span 2', display:'flex', alignItems:'center', gap:12 }}>
                  <button className={'tgl '+(mvt.addToCharges?'on':'off')} onClick={()=>setMvt(m=>({...m,addToCharges:!m.addToCharges}))}></button>
                  <label style={{ marginBottom:0 }}>📋 Ajouter automatiquement aux charges</label>
                </div>
                {mvt.addToCharges && (
                  <div className="fgp" style={{ gridColumn:'span 2' }}>
                    <label>💰 Prix unitaire (MAD/{mvt.unit})</label>
                    <input type="number" value={mvt.price} onChange={e=>setMvt(m=>({...m,price:e.target.value}))} min="0" placeholder="Ex: 15"/>
                    {mvt.qty&&mvt.price&&<div className="al al-ok" style={{ marginTop:6 }}>Montant charge : <strong>{fmt(parseFloat(mvt.qty)*parseFloat(mvt.price))}</strong></div>}
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
