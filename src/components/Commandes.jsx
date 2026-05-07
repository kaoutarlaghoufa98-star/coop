// ════════════════════════════════════════════════
// COOP TAFERNOUT — Commandes clients
//
// Cette page gère les commandes clients avant facturation.
// On peut créer des commandes, modifier leur statut, les imprimer,
// et les livrer. La livraison crée automatiquement une vente
// et met à jour les créances clients si le paiement est incomplet.
// ════════════════════════════════════════════════

const { useState: useStateCommandes } = React;

const UNITES = ['pièce','boîte','kg','plateau','portion','lot'];

function Commandes({ data, updateData, appLogo }) {
  const [tab,   setTab]   = useStateCommandes('actuel');
  const [showP, setShowP] = useStateCommandes(false);
  const [edit,  setEdit]  = useStateCommandes(null);
  const [printC,setPrintC]= useStateCommandes(null);
  const [toast, setToast] = useStateCommandes(null);
  const [err,   setErr]   = useStateCommandes('');
  const [form,  setForm]  = useStateCommandes({
    client:'', phone:'', livraison:'', notes:'', avance:0,
    items:[{ name:'', qty:1, unite:'pièce', price:0 }], statut:'en_cours'
  });

  const open = (cmd=null) => {
    setErr('');
    setEdit(cmd);
    setForm(cmd
      ? { client:cmd.client, phone:cmd.phone, livraison:cmd.livraison,
          notes:cmd.notes||'', avance:cmd.avance||0,
          items:cmd.items.map(i=>({...i})), statut:cmd.statut }
      : { client:'', phone:'', livraison:'', notes:'', avance:0,
          items:[{name:'',qty:1,unite:'pièce',price:0}], statut:'en_cours' }
    );
    setShowP(true);
  };

  const addIt  = () => setForm(f=>({...f,items:[...f.items,{name:'',qty:1,unite:'pièce',price:0}]}));
  const updIt  = (idx,fld,val) => setForm(f=>({...f,items:f.items.map((it,i)=>i===idx?{...it,[fld]:(fld==='qty'||fld==='price')?parseFloat(val)||0:val}:it)}));
  const remIt  = idx => setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}));
  const tot    = form.items.reduce((a,i)=>a+i.qty*i.price,0);
  const reste  = Math.max(0, tot - (parseFloat(form.avance)||0));

  const save = () => {
    if (!form.client) { setErr('Le nom du client est obligatoire.'); return; }
    if (!form.livraison) { setErr('La date de livraison est obligatoire.'); return; }
    const validItems = form.items.filter(i=>i.name&&i.qty>0);
    if (!validItems.length) { setErr('Ajoutez au moins un article.'); return; }
    setErr('');
    const n   = String(Date.now()).slice(-6);
    const cmd = { ...form, items:validItems, total:tot, avance:parseFloat(form.avance)||0,
                  id:Date.now(), num:'CMD-'+n, date:td() };
    if (edit) updateData('commandes', (data.commandes||[]).map(c=>c.id===edit.id?{...c,...cmd,id:edit.id,num:edit.num,date:edit.date}:c));
    else      updateData('commandes', [...(data.commandes||[]), cmd]);
    setToast('✅ Commande enregistrée');
    setShowP(false);
  };

  // Livrer → transforme en facture
  const livrer = id => {
    const cmd = (data.commandes||[]).find(c=>c.id===id);
    if (!cmd) return;
    // Met la commande en "livrée"
    updateData('commandes', (data.commandes||[]).map(c=>c.id===id?{...c,statut:'livrée'}:c));
    // Crée la facture/vente correspondante
    const sale = {
      id: Date.now(), date:td(),
      client: cmd.client, clientId:null,
      items: cmd.items.map(i=>({ productId:null, name:i.name, qty:i.qty, price:i.price })),
      subtotal:cmd.total, total:cmd.total,
      paid: cmd.avance||0, credit: cmd.total > (cmd.avance||0),
      status: cmd.total>(cmd.avance||0)?'créance':'payé',
      fromCommande: cmd.num
    };
    // Mise à jour créance client si avance < total
    if (sale.credit) {
      const cl = data.clients.find(c=>c.name===cmd.client);
      if (cl) updateData('clients', data.clients.map(c=>c.id===cl.id?{...c,credit:+(c.credit+(cmd.total-(cmd.avance||0))).toFixed(2)}:c));
    }
    updateData('sales', [sale, ...data.sales]);
    setToast('✅ Commande livrée et facture créée !');
  };

  const updSt = (id,s) => {
    updateData('commandes', (data.commandes||[]).map(c=>c.id===id?{...c,statut:s}:c));
    setToast('✅ Statut mis à jour');
  };

  const del = id => {
    if (window.confirm('Supprimer ?')) {
      updateData('commandes', (data.commandes||[]).filter(c=>c.id!==id));
      setToast('🗑️ Supprimée');
    }
  };

  const cmds = data.commandes||[];
  const cols = [
    { key:'en_cours',  label:'🔵 En cours',  col:'#1565C0' },
    { key:'confirmée', label:'🟢 Confirmée', col:'#2E7D32' },
    { key:'livrée',    label:'✅ Livrée',    col:'#558B2F' },
    { key:'annulée',   label:'❌ Annulée',   col:'#C62828' },
  ];

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      {/* Aperçu bon de commande */}
      {printC && (
        <div className="panel-overlay" onClick={e=>e.target===e.currentTarget&&setPrintC(null)}>
          <div className="panel" style={{ width:620 }}>
            <div className="panel-header">
              <h2>🖨️ Bon de commande — {printC.num}</h2>
              <button className="panel-close" onClick={()=>setPrintC(null)}>✕</button>
            </div>
            <div className="panel-body">
              <div style={{ marginBottom:'1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.88rem', padding:'1rem', background:'var(--be0)', borderRadius:8 }}>
                <div><strong>Client :</strong> {printC.client}</div>
                <div><strong>Tél :</strong> {printC.phone}</div>
                <div><strong>Commande :</strong> {printC.date}</div>
                <div><strong>Livraison :</strong> {printC.livraison}</div>
                {printC.notes&&<div style={{ gridColumn:'span 2' }}><strong>Notes :</strong> {printC.notes}</div>}
              </div>
              <table>
                <thead><tr><th>Produit</th><th>Qté</th><th>Unité</th><th>Prix unit.</th><th>Total</th></tr></thead>
                <tbody>{printC.items.map((i,idx)=>(
                  <tr key={idx}><td>{i.name}</td><td>{i.qty}</td><td>{i.unite||'pièce'}</td><td>{i.price.toFixed(2)} MAD</td><td style={{ fontWeight:600 }}>{(i.qty*i.price).toFixed(2)} MAD</td></tr>
                ))}</tbody>
                <tfoot>
                  <tr><td colSpan="4">Avance reçue</td><td>{fmt(printC.avance||0)}</td></tr>
                  <tr style={{ fontWeight:700 }}><td colSpan="4">TOTAL</td><td>{printC.total.toFixed(2)} MAD</td></tr>
                  <tr style={{ fontWeight:700, color:'var(--warn)' }}><td colSpan="4">RESTE À PAYER</td><td>{fmt(Math.max(0,printC.total-(printC.avance||0)))}</td></tr>
                </tfoot>
              </table>
            </div>
            <div className="panel-footer">
              <button className="btn btn-s" onClick={()=>setPrintC(null)}>Fermer</button>
              <button className="btn btn-p" onClick={()=>doPrint(buildCmdHTML(printC,appLogo))}>🖨️ Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'1.5rem' }}>
        {cols.map(c=>(
          <div key={c.key} className="sc" style={{ borderTop:'3px solid '+c.col }}>
            <div className="sl">{c.label}</div>
            <div className="sv">{cmds.filter(x=>x.statut===c.key).length}</div>
            <div className="ss">{fmtN(cmds.filter(x=>x.statut===c.key).reduce((a,x)=>a+x.total,0))} MAD</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <div className={'tab '+(tab==='actuel' ?'active':'')} onClick={()=>setTab('actuel')}>📋 Actuel</div>
        <div className={'tab '+(tab==='kanban' ?'active':'')} onClick={()=>setTab('kanban')}>🗂️ Kanban</div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem' }}>
        <button className="btn btn-p" onClick={()=>open()}>➕ Nouvelle commande</button>
      </div>

      {/* Vue Actuel */}
      {tab==='actuel' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>N°</th><th>📅 Date</th><th>👤 Client</th><th>📦 Articles</th><th>Total</th><th>Avance</th><th>Reste</th><th>🚚 Livraison</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {cmds.map(cmd=>{
                  const rst = Math.max(0,cmd.total-(cmd.avance||0));
                  return (
                    <tr key={cmd.id}>
                      <td style={{ fontFamily:'monospace', color:'var(--br7)', fontWeight:600 }}>{cmd.num}</td>
                      <td style={{ color:'var(--tx3)' }}>{cmd.date}</td>
                      <td><strong>{cmd.client}</strong><br/><span style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>{cmd.phone}</span></td>
                      <td style={{ fontSize:'0.78rem', color:'var(--tx3)' }}>{cmd.items.map(i=>i.name+'×'+i.qty+(i.unite?' '+i.unite:'')).join(', ')}</td>
                      <td style={{ fontWeight:700, color:'var(--br8)' }}>{fmt(cmd.total)}</td>
                      <td style={{ color:'var(--ok)', fontWeight:600 }}>{fmt(cmd.avance||0)}</td>
                      <td style={{ color:rst>0?'var(--ng)':'var(--ok)', fontWeight:700 }}>{fmt(rst)}</td>
                      <td>{cmd.livraison}</td>
                      <td>
                        <select value={cmd.statut} onChange={e=>updSt(cmd.id,e.target.value)}
                          style={{ padding:'4px 8px', border:'1px solid var(--bdr)', borderRadius:6, fontSize:'0.8rem', background:'white' }}>
                          {STATUTS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        <button className="btn btn-sm btn-s" style={{ marginRight:4 }} onClick={()=>open(cmd)}>✏️</button>
                        <button className="btn btn-sm btn-p" style={{ marginRight:4 }} onClick={()=>setPrintC(cmd)}>🖨️</button>
                        {cmd.statut!=='livrée'&&<button className="btn btn-sm btn-ok" style={{ marginRight:4 }} onClick={()=>livrer(cmd.id)}>🚚 Livrer</button>}
                        <button className="btn btn-sm btn-d" onClick={()=>del(cmd.id)}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Kanban */}
      {tab==='kanban' && (
        <div className="kanban">
          {cols.map(col=>(
            <div key={col.key} className="kcol">
              <div className="kcolhd" style={{ color:col.col }}>
                {col.label}
                <span style={{ background:col.col, color:'white', borderRadius:999, padding:'2px 8px', fontSize:'0.75rem' }}>
                  {cmds.filter(c=>c.statut===col.key).length}
                </span>
              </div>
              {cmds.filter(c=>c.statut===col.key).map(cmd=>{
                const rst = Math.max(0,cmd.total-(cmd.avance||0));
                return (
                  <div key={cmd.id} className="kcard">
                    <div style={{ fontSize:'0.72rem', color:'var(--tx3)', fontFamily:'monospace' }}>{cmd.num}</div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem', margin:'2px 0' }}>👤 {cmd.client}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>🚚 {cmd.livraison}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--tx3)', marginTop:2 }}>{cmd.items.map(i=>i.name+'×'+i.qty).join(', ')}</div>
                    <div style={{ fontWeight:700, color:'var(--gold)', fontSize:'0.95rem', marginTop:6 }}>{fmt(cmd.total)}</div>
                    {cmd.avance>0&&<div style={{ fontSize:'0.72rem', color:'var(--ok)' }}>Avance: {fmt(cmd.avance)} · Reste: {fmt(rst)}</div>}
                    <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }} onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-sm btn-s" onClick={()=>open(cmd)}>✏️</button>
                      <button className="btn btn-sm btn-s" onClick={()=>setPrintC(cmd)}>🖨️</button>
                      {cmd.statut!=='livrée'&&<button className="btn btn-sm btn-ok" onClick={()=>livrer(cmd.id)}>🚚</button>}
                      <button className="btn btn-sm btn-d" onClick={()=>del(cmd.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
              {!cmds.filter(c=>c.statut===col.key).length&&(
                <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--tx3)', fontSize:'0.82rem' }}>Aucune commande</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel créer/modifier */}
      {showP && (
        <Panel title={edit?'✏️ Modifier commande':'➕ Nouvelle commande'} onClose={()=>setShowP(false)} wide
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          {err&&<div className="al al-d" style={{ marginBottom:'1rem' }}>⚠️ {err}</div>}
          <div className="fg">
            <div className="fgp">
              <label>👤 Client *</label>
              <input list="cl-l" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} placeholder="Nom du client"/>
              <datalist id="cl-l">{data.clients.map(c=><option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div className="fgp"><label>📞 Téléphone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06XXXXXXXX"/></div>
            <div className="fgp"><label>🚚 Date de livraison *</label><input type="date" value={form.livraison} onChange={e=>setForm(f=>({...f,livraison:e.target.value}))}/></div>
            <div className="fgp">
              <label>🏷️ Statut</label>
              <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>
                {STATUTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>📝 Notes</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Informations sur la commande..."/>
            </div>
          </div>

          {/* Articles avec unité et montant */}
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.8rem' }}>
              <label style={{ fontWeight:600, color:'var(--br7)', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.8px' }}>📦 Articles *</label>
              <button className="btn btn-sm btn-s" onClick={addIt}>+ Ajouter</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 60px 80px 80px 80px 34px', gap:6, marginBottom:6, fontSize:'0.72rem', color:'var(--tx3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              <span>Produit</span><span>Qté</span><span>Unité</span><span>Prix unit.</span><span>Montant</span><span></span>
            </div>
            {form.items.map((item,idx)=>(
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 60px 80px 80px 80px 34px', gap:6, marginBottom:8, alignItems:'center' }}>
                <input list="prods-l" value={item.name} onChange={e=>updIt(idx,'name',e.target.value)} placeholder="Produit"
                  style={{ padding:'8px 12px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem' }}/>
                <datalist id="prods-l">{data.products.map(p=><option key={p.id} value={p.name}/>)}</datalist>
                <input type="number" value={item.qty} onChange={e=>updIt(idx,'qty',e.target.value)} min="1" placeholder="Qté"
                  style={{ padding:'8px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem' }}/>
                <select value={item.unite||'pièce'} onChange={e=>updIt(idx,'unite',e.target.value)}
                  style={{ padding:'8px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.85rem' }}>
                  {UNITES.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <input type="number" value={item.price} onChange={e=>updIt(idx,'price',e.target.value)} min="0" placeholder="Prix"
                  style={{ padding:'8px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem' }}/>
                <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--br7)', textAlign:'right' }}>{(item.qty*item.price).toFixed(0)}</div>
                <button className="btn btn-sm btn-d" onClick={()=>remIt(idx)} disabled={form.items.length===1}>✕</button>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, padding:'10px 14px', background:'var(--be0)', borderRadius:8 }}>
              <span style={{ fontSize:'0.85rem', color:'var(--tx2)' }}>💵 Avance (MAD)</span>
              <input type="number" value={form.avance} onChange={e=>setForm(f=>({...f,avance:parseFloat(e.target.value)||0}))} min="0"
                style={{ width:120, padding:'6px 10px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem', textAlign:'right' }}/>
            </div>
            <div style={{ textAlign:'right', fontWeight:700, fontSize:'1.1rem', color:'var(--br8)', marginTop:8 }}>Total : {fmt(tot)}</div>
            {(form.avance>0) && <div style={{ textAlign:'right', fontSize:'0.9rem', color:'var(--warn)', fontWeight:600 }}>Reste à payer : {fmt(reste)}</div>}
          </div>
        </Panel>
      )}
    </div>
  );
}
