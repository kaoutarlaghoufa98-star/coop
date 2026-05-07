// ════════════════════════════════════════════════
// COOP TAFERNOUT — Point de Vente (POS)
//
// Cette page simule le point de vente.
// Elle permet de sélectionner des produits, de gérer un panier,
// d'enregistrer une vente payée ou une vente à crédit,
// et de mettre à jour le stock produit en temps réel.
// ════════════════════════════════════════════════

const { useState: useStatePOS } = React;

function POS({ data, updateData, appLogo }) {
  const [cart, setCart]     = useStatePOS([]);
  const [sc, setSc]         = useStatePOS('');
  const [cm, setCm]         = useStatePOS(false);
  const [pa, setPa]         = useStatePOS('');
  const [filter, setF]      = useStatePOS('Tous');
  const [toast, setToast]   = useStatePOS(null);
  const [showAddC, setAddC] = useStatePOS(false);
  const [newC, setNewC]     = useStatePOS({ name:'', phone:'' });

  const cats     = ['Tous', ...new Set(data.products.map(p=>p.category))];
  const filtered = filter==='Tous' ? data.products : data.products.filter(p=>p.category===filter);
  const sub      = cart.reduce((a,i) => a + i.price*i.qty, 0);
  const paid     = parseFloat(pa)||0;
  const change   = paid - sub;

  const add = p => {
    if (p.stock<=0) return;
    setCart(prev => {
      const ex = prev.find(i=>i.id===p.id);
      if (ex) return prev.map(i=>i.id===p.id ? {...i,qty:i.qty+1} : i);
      return [...prev, {...p, qty:1}];
    });
  };

  const updQty = (id, val) => {
    const n = parseInt(val)||0;
    if (n<=0) setCart(prev=>prev.filter(i=>i.id!==id));
    else setCart(prev=>prev.map(i=>i.id===id?{...i,qty:n}:i));
  };

  const upd = (id, d) =>
    setCart(prev => prev.map(i=>i.id===id?{...i,qty:Math.max(0,i.qty+d)}:i).filter(i=>i.qty>0));

  const saveClient = () => {
    if (!newC.name || !newC.phone) { setToast('⚠️ Nom et téléphone requis'); return; }
    updateData('clients', [...data.clients, { ...newC, id:Date.now(), credit:0, notes:'' }]);
    setSc(newC.name);
    setNewC({ name:'', phone:'' });
    setAddC(false);
    setToast('✅ Client ajouté');
  };

  const validate = () => {
    if (!cart.length) return;
    if (!cm && paid < sub) { setToast('❌ Montant insuffisant. Manque: '+(sub-paid).toFixed(2)+' MAD'); return; }
    if (cm && !sc) { setToast('⚠️ Choisissez un client pour une vente à crédit'); return; }

    const sale = {
      id:Date.now(), date:td(),
      client: sc||'Client Comptoir', clientId:null,
      items: cart.map(i=>({ productId:i.id, name:i.name, qty:i.qty, price:i.price })),
      subtotal:sub, total:sub, paid:cm?0:sub, credit:cm,
      status: cm?'créance':'payé'
    };

    if (sc && cm) {
      const cl = data.clients.find(c=>c.name===sc);
      if (cl) updateData('clients', data.clients.map(c=>c.id===cl.id?{...c,credit:+(c.credit+sub).toFixed(2)}:c));
    }

    updateData('products', data.products.map(p=>{ const it=cart.find(i=>i.id===p.id); return it?{...p,stock:Math.max(0,p.stock-it.qty)}:p; }));
    updateData('sales', [sale, ...data.sales]);
    setCart([]); setSc(''); setPa(''); setCm(false);
    setToast('✅ Vente enregistrée !');
  };

  return (
    <div className="page-body" style={{ padding:'1.5rem' }}>
      {toast && <Toast msg={toast} onClose={()=>setToast(null)} />}

      {/* Modal ajout client rapide */}
      {showAddC && (
        <div className="panel-overlay" onClick={e=>e.target===e.currentTarget&&setAddC(false)}>
          <div className="panel" style={{ width:400 }}>
            <div className="panel-header">
              <h2>👤 Nouveau client rapide</h2>
              <button className="panel-close" onClick={()=>setAddC(false)}>✕</button>
            </div>
            <div className="panel-body">
              <div className="fgp">
                <label>Nom complet *</label>
                <input value={newC.name} onChange={e=>setNewC(n=>({...n,name:e.target.value}))} placeholder="Prénom Nom"/>
              </div>
              <div className="fgp">
                <label>Téléphone *</label>
                <input value={newC.phone} onChange={e=>setNewC(n=>({...n,phone:e.target.value}))} placeholder="06XXXXXXXX"/>
              </div>
            </div>
            <div className="panel-footer">
              <button className="btn btn-s" onClick={()=>setAddC(false)}>Annuler</button>
              <button className="btn btn-p" onClick={saveClient}>💾 Ajouter</button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-layout">
        {/* ── Grille produits ── */}
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {cats.map(c => (
              <button key={c} className={'btn btn-sm '+(filter===c?'btn-p':'btn-s')} onClick={()=>setF(c)}>
                {c==='Tous'?'🍰 Tous':c}
              </button>
            ))}
          </div>
          <div className="pgrid">
            {filtered.map(p => (
              <div key={p.id} className="ptile" onClick={()=>add(p)}
                style={{ opacity:p.stock<=0?0.45:1, cursor:p.stock<=0?'not-allowed':'pointer' }}>
                {p.image && p.image.length>10
                  ? <img src={p.image} className="pimg" alt={p.name} onError={e=>e.target.style.display='none'}/>
                  : <div style={{ width:'100%', height:90, background:'var(--be2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🎂</div>
                }
                <div className="pinfo">
                  <div className="pn">{p.name}</div>
                  <div className="pp">{p.price} MAD</div>
                  <div className="ps" style={{ color:p.stock<=0?'var(--ng)':p.stock<=p.minStock?'var(--warn)':'var(--tx3)' }}>
                    {p.stock<=0?'⛔ Rupture':'📦 '+p.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panier ── */}
        <div className="cart-panel">
          <div className="cart-hd">
            <h3 style={{ fontSize:'1rem', color:'var(--br9)' }}>🛒 Panier ({cart.reduce((a,i)=>a+i.qty,0)})</h3>
            {cart.length>0 && <button className="btn btn-sm btn-d" onClick={()=>setCart([])}>🗑️</button>}
          </div>

          {/* Client + bouton ajouter */}
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--bdr)' }}>
            <div style={{ display:'flex', gap:6, marginBottom:6 }}>
              <select value={sc} onChange={e=>setSc(e.target.value)}
                style={{ flex:1, padding:'8px 10px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.85rem', background:'white' }}>
                <option value="">👤 Client comptoir</option>
                {data.clients.map(c=>(
                  <option key={c.id} value={c.name}>{c.name}{c.credit>0?' ⚠️ '+fmtN(c.credit)+' MAD':''}</option>
                ))}
              </select>
              <button className="btn btn-sm btn-s" title="Ajouter un client" onClick={()=>setAddC(true)}>➕</button>
            </div>
          </div>

          {/* Articles */}
          <div className="cart-items">
            {!cart.length
              ? <div className="empty" style={{ padding:'2rem' }}><span className="ei">🛒</span><small>Cliquez sur un produit</small></div>
              : cart.map(item => (
                <div key={item.id} className="ci">
                  <div className="cinfo" style={{ flex:1 }}>
                    <div className="cn">{item.name}</div>
                    <div className="cp">{item.price} MAD × {item.qty} = {(item.price*item.qty).toFixed(2)} MAD</div>
                  </div>
                  <div className="qc">
                    <button className="qb" onClick={()=>upd(item.id,-1)}>−</button>
                    <input
                      type="number" min="1"
                      value={item.qty}
                      onChange={e=>updQty(item.id,e.target.value)}
                      onFocus={e=>e.target.select()}
                      style={{ width:40, textAlign:'center', border:'1px solid var(--bdr)', borderRadius:6, fontSize:'0.85rem', fontWeight:700, padding:'2px 0' }}
                    />
                    <button className="qb" onClick={()=>upd(item.id,1)}>+</button>
                  </div>
                </div>
              ))
            }
          </div>

          <div className="cart-ft">
            <div className="crow total"><span>TOTAL</span><span>{sub.toFixed(2)} MAD</span></div>

            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'10px 0 8px', padding:'8px', background:'var(--be0)', borderRadius:8 }}>
              <button className={'tgl '+(cm?'on':'off')} onClick={()=>setCm(!cm)}></button>
              <span style={{ fontSize:'0.85rem', color:cm?'var(--warn)':'var(--tx3)', fontWeight:cm?600:400 }}>
                {cm?'⚠️ Mode créance':'💳 Créance'}
              </span>
            </div>

            {!cm && (
              <>
                <input type="number" className="pinput" placeholder="💵 Montant remis (MAD)"
                  value={pa} onChange={e=>setPa(e.target.value)} min="0"/>
                {paid>0 && (
                  <div className="cdisplay" style={{ background:change>=0?'var(--br1)':'#FFEBEE', color:change>=0?'var(--br8)':'var(--ng)' }}>
                    {change>=0 ? `💵 Monnaie : ${change.toFixed(2)} MAD` : `❌ Manque : ${Math.abs(change).toFixed(2)} MAD`}
                  </div>
                )}
              </>
            )}

            <button className="btn btn-p" style={{ width:'100%', marginTop:8, padding:'13px', fontSize:'1rem', justifyContent:'center' }}
              onClick={validate} disabled={!cart.length}>
              {cm?'✅ Enregistrer créance':'✅ Encaisser '+sub.toFixed(2)+' MAD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
