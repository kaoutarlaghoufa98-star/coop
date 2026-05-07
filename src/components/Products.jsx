// ════════════════════════════════════════════════
// COOP TAFERNOUT — Gestion des produits
//
// Affiche le catalogue des produits.
// Depuis cette page, l'utilisateur peut ajouter, modifier et supprimer
// des produits. Les données sont enregistrées via updateData('products', ...).
// Chaque produit contient un stock, un prix de vente, un coût et un seuil minimum.
// ════════════════════════════════════════════════

const { useState: useStateProducts } = React;

function Products({ data, updateData }) {
  const [showP, setShowP] = useStateProducts(false);
  const [edit,  setEdit]  = useStateProducts(null);
  const [form,  setForm]  = useStateProducts({ name:'', category:'', price:'', cost:'', stock:'', minStock:'', image:'' });
  const [toast, setToast] = useStateProducts(null);
  const [err,   setErr]   = useStateProducts('');

  const cats = [...new Set(data.products.map(p=>p.category))];

  const open = (item=null) => {
    setErr('');
    setEdit(item);
    setForm(item
      ? {...item, price:String(item.price), cost:String(item.cost), stock:String(item.stock), minStock:String(item.minStock), image:item.image||''}
      : { name:'', category:'', price:'', cost:'', stock:'', minStock:'', image:'' }
    );
    setShowP(true);
  };

  const save = () => {
    // Tous les champs obligatoires
    if (!form.name || !form.category || !form.price || !form.stock || !form.minStock) {
      setErr('Tous les champs sont obligatoires.'); return;
    }
    setErr('');
    const item = { ...form, price:parseFloat(form.price), cost:parseFloat(form.cost)||0, stock:parseInt(form.stock)||0, minStock:parseInt(form.minStock)||0 };
    if (edit) {
      updateData('products', data.products.map(p=>p.id===edit.id ? {...p,...item} : p));
      setToast('✅ Produit modifié');
    } else {
      updateData('products', [...data.products, {...item, id:Date.now()}]);
      setToast('✅ Produit ajouté');
    }
    setShowP(false);
  };

  const del = id => {
    if (window.confirm('Supprimer ce produit ?')) {
      updateData('products', data.products.filter(p=>p.id!==id));
      setToast('🗑️ Supprimé');
    }
  };

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.9rem', color:'var(--tx3)' }}>
          🎂 {data.products.length} produits · ⚠️ {data.products.filter(p=>p.stock<=p.minStock).length} alertes
        </div>
        <button className="btn btn-p" onClick={()=>open()}>➕ Nouveau produit</button>
      </div>

      <div className="pgrid2">
        {data.products.map(p => {
          const mg = p.price>0 ? Math.round((p.price-p.cost)/p.price*100) : 0;
          const sc = p.stock<=0?'var(--ng)':p.stock<=p.minStock?'var(--warn)':'var(--ok)';
          return (
            <div key={p.id} className="pcard">
              {p.image && p.image.length>10
                ? <img src={p.image} className="pcard-img" alt={p.name} onError={e=>e.target.style.display='none'}/>
                : <div style={{ width:'100%', height:140, background:'var(--be2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>🎂</div>
              }
              <div className="pcard-body">
                <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{p.name}</div>
                <div><span className="chip">{p.category}</span></div>
                <div style={{ marginTop:'0.5rem', display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontWeight:700, color:'var(--br7)', fontSize:'0.95rem' }}>{p.price} MAD</span>
                  <span className={'badge '+(mg>=40?'bg':mg>=25?'bo':'br')}>Marge {mg}%</span>
                </div>
              </div>
              <div className="pcard-ft">
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                  <div style={{ flex:1 }}>
                    <div className="sbar-w">
                      <div className="sbar" style={{ width:Math.min(100,p.minStock>0?p.stock/(p.minStock*2)*100:50)+'%', background:sc }}/>
                    </div>
                  </div>
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:sc, minWidth:28 }}>{p.stock}</span>
                </div>
                <div style={{ display:'flex', gap:4, marginLeft:8 }}>
                  <button className="btn btn-sm btn-s" onClick={()=>open(p)}>✏️</button>
                  <button className="btn btn-sm btn-d" onClick={()=>del(p.id)}>🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showP && (
        <Panel title={edit?'✏️ Modifier produit':'➕ Nouveau produit'} onClose={()=>setShowP(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          {err && <div className="al al-d" style={{ marginBottom:'1rem' }}>⚠️ {err}</div>}
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>Nom *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Mille-feuille au caramel"/>
            </div>
            <div className="fgp">
              <label>Catégorie *</label>
              <input list="cats-l" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Ex: Feuilletés"/>
              <datalist id="cats-l">{cats.map(c=><option key={c} value={c}/>)}</datalist>
            </div>
            <div className="fgp">
              <label>💰 Prix vente (MAD) *</label>
              <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} min="0"/>
            </div>
            <div className="fgp">
              <label>📉 Coût revient (MAD)</label>
              <input type="number" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} min="0"/>
            </div>
            <div className="fgp">
              <label>📦 Stock actuel *</label>
              <input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} min="0"/>
            </div>
            <div className="fgp">
              <label>⚠️ Stock minimum *</label>
              <input type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} min="0"/>
            </div>
            {/* Image : ajout manuel uniquement, pas d'auto */}
            <div className="fgp" style={{ gridColumn:'span 2' }}>
              <label>🖼️ Image (ajout manuel)</label>
              <ImgUp value={form.image} onChange={v=>setForm(f=>({...f,image:v}))}/>
              {form.image && form.image.length>10 && (
                <button className="btn btn-sm btn-d" style={{ marginTop:6 }} onClick={()=>setForm(f=>({...f,image:''}))}>🗑️ Supprimer image</button>
              )}
            </div>
          </div>
          {form.price && form.cost && parseFloat(form.price)>0 && (
            <div className="al al-ok">
              📊 Marge : <strong>{Math.round((parseFloat(form.price)-parseFloat(form.cost||0))/parseFloat(form.price)*100)}%</strong>
              {' '}— Bénéfice : <strong>{(parseFloat(form.price)-parseFloat(form.cost||0)).toFixed(2)} MAD</strong>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
