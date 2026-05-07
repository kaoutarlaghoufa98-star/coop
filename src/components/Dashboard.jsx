// ════════════════════════════════════════════════
// COOP TAFERNOUT — Tableau de bord
//
// Cette page affiche des indicateurs clés de l'activité : ventes,
// charges, bénéfice, créances et alertes de stock.
// Elle utilise les données globales pour construire des graphiques
// de ventes et des listes récentes de ventes.
// ════════════════════════════════════════════════

const { useRef, useEffect: useEffectDash, useState: useStateDash } = React;

function Dashboard({ data }) {
  const c1 = useRef(null), c2 = useRef(null);
  const i1 = useRef(null), i2 = useRef(null);
  const [notif, setNotif] = useStateDash(true);

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  // Filtrage mensuel
  const salesM   = data.sales.filter(s => { const d = new Date(s.date); return d.getMonth()===month && d.getFullYear()===year; });
  const chargesM = data.charges.filter(c => { const d = new Date(c.date); return d.getMonth()===month && d.getFullYear()===year; });

  const ts  = salesM.reduce((a, s) => a + s.total, 0);
  const tc  = chargesM.reduce((a, c) => a + c.amount, 0);
  const ben = ts - tc; // bénéfice (peut être négatif)
  const tcr = data.clients.reduce((a, c) => a + c.credit, 0);
  const ls  = (data.rawMaterials || []).filter(m => m.currentStock <= m.minStock);

  // Alertes actives
  const alerts = [];
  if (ls.length > 0)                         alerts.push({ type:'stock',   msg: `${ls.length} matière(s) en rupture ou stock faible`, icon:'📦' });
  if (data.clients.filter(c=>c.credit>0).length) alerts.push({ type:'credit',  msg: `${data.clients.filter(c=>c.credit>0).length} client(s) avec créance`, icon:'💳' });
  if (data.charges.filter(c=>!c.paid).length)    alerts.push({ type:'charge',  msg: `${data.charges.filter(c=>!c.paid).length} charge(s) impayée(s)`, icon:'💸' });

  // Graphique 1 : ventes 15 derniers jours
  useEffectDash(() => {
    if (!c1.current) return;
    if (i1.current) i1.current.destroy();
    const labels = [], vals = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('fr-MA', { day:'2-digit', month:'2-digit' }));
      vals.push(data.sales.filter(s => s.date === key).reduce((a, s) => a + s.total, 0));
    }
    i1.current = new Chart(c1.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label:'Ventes', data:vals, backgroundColor:'rgba(122,69,32,0.75)', borderRadius:5, borderSkipped:false }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ grid:{ display:false }, ticks:{ font:{size:10} } }, y:{ ticks:{ callback: v => v+'MAD' } } }
      }
    });
  }, [data.sales]);

  // Graphique 2 : meilleure vente du jour (top produits aujourd'hui)
  useEffectDash(() => {
    if (!c2.current) return;
    if (i2.current) i2.current.destroy();
    const todayKey = new Date().toISOString().split('T')[0];
    const todaySales = data.sales.filter(s => s.date === todayKey);
    const prodMap = {};
    todaySales.forEach(s => s.items.forEach(it => { prodMap[it.name] = (prodMap[it.name]||0) + it.qty * it.price; }));
    const sorted = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const labels = sorted.length ? sorted.map(e=>e[0]) : ['Aucune vente aujourd\'hui'];
    const vals   = sorted.length ? sorted.map(e=>e[1]) : [0];
    i2.current = new Chart(c2.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets:[{ data:vals, backgroundColor:['#7A4520','#B87040','#D4935C','#E8BF9A','#C9952A','#9B5C30'], borderWidth:3, borderColor:'#FDF5EE' }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'right', labels:{ font:{size:11}, boxWidth:12, padding:8 } } }
      }
    });
  }, [data.sales]);

  return (
    <div className="page-body">

      {/* ── Pop-up alertes ── */}
      {notif && alerts.length > 0 && (
        <div style={{ position:'fixed', top:80, right:20, zIndex:9999, width:320, background:'white',
                      borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.18)', border:'1px solid var(--bdr)',
                      animation:'tIn 0.3s ease', overflow:'hidden' }}>
          <div style={{ background:'var(--br7)', color:'white', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'0.9rem' }}>🔔 {alerts.length} notification(s)</span>
            <button onClick={()=>setNotif(false)} style={{ background:'transparent', color:'white', border:'none', fontSize:'1.1rem', cursor:'pointer', lineHeight:1 }}>✕</button>
          </div>
          {alerts.map((a,i) => (
            <div key={i} className={'al ' + (a.type==='stock'?'al-d':a.type==='credit'?'al-w':'al-ok')} style={{ borderRadius:0, margin:0 }}>
              {a.icon} {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── KPIs mensuels ── */}
      <div className="stat-grid">
        <div className="sc g">
          <div className="si">💰</div>
          <div className="sl">Ventes du mois</div>
          <div className="sv">{fmtN(ts)} MAD</div>
          <div className="ss">{salesM.length} transaction(s)</div>
        </div>
        <div className="sc r">
          <div className="si">📉</div>
          <div className="sl">Charges du mois</div>
          <div className="sv">{fmtN(tc)} MAD</div>
          <div className="ss">{chargesM.filter(c=>!c.paid).length} impayée(s)</div>
        </div>
        <div className="sc b">
          <div className="si">📈</div>
          <div className="sl">Bénéfice mensuel</div>
          <div className="sv" style={{ color: ben>=0?'var(--ok)':'var(--ng)' }}>
            {ben < 0 ? '-' : ''}{fmtN(Math.abs(ben))} MAD
          </div>
          <div className="ss">{ts>0 ? Math.round(ben/ts*100) : 0}% de marge</div>
        </div>
        <div className="sc o">
          <div className="si">⚠️</div>
          <div className="sl">Créances clients</div>
          <div className="sv">{fmtN(tcr)} MAD</div>
          <div className="ss">{data.clients.filter(c=>c.credit>0).length} débiteur(s)</div>
        </div>
      </div>

      {/* ── Alertes stock ── */}
      {ls.length > 0 && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div className="stitle">⚠️ Alertes Stock</div>
          {ls.map(m => (
            <div key={m.id} className={'al '+(m.currentStock<=0?'al-d':'al-w')}>
              {m.currentStock<=0?'⛔':'⚠️'} <strong>{m.name}</strong> —{' '}
              {m.currentStock<=0 ? 'Rupture !' : m.currentStock+' '+m.unit+' (min: '+m.minStock+')'}
            </div>
          ))}
        </div>
      )}

      {/* ── Graphiques ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        <div className="card">
          <div className="stitle">📊 Ventes — 15 derniers jours</div>
          <div style={{ position:'relative', height:220 }}><canvas ref={c1}/></div>
        </div>
        <div className="card">
          <div className="stitle">🏆 Meilleure vente du jour</div>
          <div style={{ position:'relative', height:220 }}><canvas ref={c2}/></div>
        </div>
      </div>

      {/* ── Dernières ventes ── */}
      <div className="card">
        <div className="stitle">🛒 Dernières ventes</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Client</th><th>Articles</th><th>Total</th><th>Statut</th></tr></thead>
            <tbody>
              {data.sales.slice(0,8).map(s => (
                <tr key={s.id}>
                  <td style={{ color:'var(--tx3)' }}>{s.date}</td>
                  <td><strong>{s.client}</strong></td>
                  <td style={{ fontSize:'0.8rem', color:'var(--tx3)' }}>{s.items.map(i=>i.name).join(', ')}</td>
                  <td style={{ fontWeight:700, color:'var(--br8)' }}>{fmt(s.total)}</td>
                  <td><span className={'badge '+(s.status==='payé'?'bg':'bo')}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
