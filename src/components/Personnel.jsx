// ════════════════════════════════════════════════
// COOP TAFERNOUT — Personnel
// Calendrier journalier · Paiement → charges auto
//
// Gère les employés et leur rémunération.
// Cette page propose une liste du personnel, un tableau de paie estimé
// et un calendrier pour journaliser des paiements qui sont convertis en charges.
// ════════════════════════════════════════════════

const { useState: useStatePersonnel, useEffect: useEffectPerso } = React;

function Personnel({ data, updateData }) {
  const [showP,  setShowP]  = useStatePersonnel(false);
  const [edit,   setEdit]   = useStatePersonnel(null);
  const [tab,    setTab]    = useStatePersonnel('liste');
  const [toast,  setToast]  = useStatePersonnel(null);
  const [calEmp, setCalEmp] = useStatePersonnel(null);  // employé sélectionné pour calendrier
  const [calMois,setCalMois]= useStatePersonnel(() => new Date().toISOString().slice(0,7));
  const [dayAmt, setDayAmt] = useStatePersonnel({ day:'', amount:'' });
  const [form,   setForm]   = useStatePersonnel({ name:'', role:'', dailyRate:'', phone:'', cin:'', startDate:'', status:'actif' });

  const open = (e=null) => {
    setEdit(e);
    setForm(e
      ? {name:e.name,role:e.role||'',dailyRate:String(e.dailyRate||0),phone:e.phone||'',cin:e.cin||'',startDate:e.startDate||'',status:e.status||'actif'}
      : {name:'',role:'',dailyRate:'',phone:'',cin:'',startDate:'',status:'actif'}
    );
    setShowP(true);
  };

  const save = () => {
    if (!form.name||!form.role) return;
    const dr = parseFloat(form.dailyRate)||0;
    const emp = { ...form, dailyRate:dr, salary:dr*26 };
    if (edit) updateData('employees', data.employees.map(e=>e.id===edit.id?{...e,...emp}:e));
    else      updateData('employees', [...data.employees, {...emp, id:Date.now()}]);
    setToast('✅ Employé enregistré');
    setShowP(false);
  };

  const del = id => {
    if (window.confirm('Supprimer ?')) {
      updateData('employees', data.employees.filter(e=>e.id!==id));
      setToast('🗑️ Supprimé');
    }
  };

  // Calendrier : enregistrer un paiement journalier
  const saveDayPay = () => {
    if (!calEmp||!dayAmt.day||!dayAmt.amount) return;
    const emp    = data.employees.find(e=>e.id===calEmp);
    const amount = parseFloat(dayAmt.amount)||0;
    const dateStr= `${calMois}-${String(dayAmt.day).padStart(2,'0')}`;

    // Ajoute aux paiements de l'employé
    const payments = emp.payments || {};
    const prev     = payments[dateStr]||0;
    const updated  = { ...emp, payments:{ ...payments, [dateStr]: prev + amount } };
    updateData('employees', data.employees.map(e=>e.id===calEmp?updated:e));

    // Ajoute automatiquement aux charges
    const charge = {
      id: Date.now(), date:dateStr,
      label: `Paiement ${emp.name} — ${dateStr}`,
      category:'Personnel', type:'charge',
      amount, supplier:'', paid:true
    };
    updateData('charges', [charge, ...(data.charges||[])]);
    setToast(`✅ Paiement de ${amount} MAD enregistré dans les charges`);
    setDayAmt({day:'',amount:''});
  };

  // Jours du mois courant
  const getDaysInMonth = (ym) => {
    const [y,m] = ym.split('-').map(Number);
    return new Date(y,m,0).getDate();
  };

  const actifs = data.employees.filter(e=>e.status==='actif');
  const ts     = actifs.reduce((a,e)=>a+(e.dailyRate||0)*26,0);

  // Fonction pour calculer le total payé ce mois pour un employé
  const getTotalPaidThisMonth = (emp) => {
    const currentMonth = new Date().toISOString().slice(0,7);
    const pays = emp.payments || {};
    return Object.entries(pays)
      .filter(([date]) => date.startsWith(currentMonth))
      .reduce((sum, [, amount]) => sum + amount, 0);
  };

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}

      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(2,1fr)', marginBottom:'1.5rem' }}>
        <div className="sc b">
          <div className="sl">👥 Effectif actif</div>
          <div className="sv">{actifs.length}</div>
          <div className="ss">sur {data.employees.length} au total</div>
        </div>
        <div className="sc o">
          <div className="sl">💸 Masse salariale estimée/mois</div>
          <div className="sv">{fmtN(ts)} MAD</div>
        </div>
      </div>

      <div className="tabs">
        <div className={'tab '+(tab==='liste'   ?'active':'')} onClick={()=>setTab('liste')}>👤 Équipe</div>
        <div className={'tab '+(tab==='paie'    ?'active':'')} onClick={()=>setTab('paie')}>💰 Tableau de paie</div>
        <div className={'tab '+(tab==='calendrier'?'active':'')} onClick={()=>setTab('calendrier')}>📅 Calendrier paiements</div>
      </div>

      {/* ── Liste ── */}
      {tab==='liste' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.5rem' }}>
            <button className="btn btn-p" onClick={()=>open()}>➕ Nouvel employé</button>
          </div>
          <div className="egrid">
            {data.employees.map(e=>{
              const dr = e.dailyRate||Math.round((e.salary||0)/26);
              return (
                <div key={e.id} className="ecard">
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div className="eavatar">{e.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{e.name}</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--tx3)' }}>{e.role}</div>
                      {e.cin&&<div style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>🪪 {e.cin}</div>}
                    </div>
                    <div style={{ marginLeft:'auto' }}>
                      <span className={'badge '+(e.status==='actif'?'bg':e.status==='congé'?'bo':'br')}>{e.status}</span>
                    </div>
                  </div>
                  <div className="esalbadge">
                    <div>
                      <div style={{ fontSize:'0.7rem', color:'var(--tx3)' }}>Taux journalier</div>
                      <div style={{ fontWeight:700, fontSize:'1.05rem', color:'var(--br8)' }}>{fmtN(dr)} MAD/j</div>
                    </div>
                    <div className="dayrate">📅 ~{fmtN(dr*26)} MAD/mois</div>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--tx3)', margin:'8px 0' }}>
                    📞 {e.phone}&nbsp;&nbsp;🗓️ Depuis {e.startDate}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm btn-s" style={{ flex:1 }} onClick={()=>open(e)}>✏️ Modifier</button>
                    <button className="btn btn-sm btn-d" onClick={()=>del(e.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Tableau de paie ── */}
      {tab==='paie' && (
        <div className="card">
          <div className="stitle">💰 Tableau de paie (estimé + payé ce mois)</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employé</th><th>Poste</th><th>CIN</th><th>Taux/Jour</th><th>Salaire mensuel (26j)</th><th>Payé ce mois</th><th>Statut</th></tr></thead>
              <tbody>
                {data.employees.map(e=>{
                  const dr = e.dailyRate||Math.round((e.salary||0)/26);
                  const paidThisMonth = getTotalPaidThisMonth(e);
                  return (
                    <tr key={e.id}>
                      <td><strong>{e.name}</strong></td>
                      <td>{e.role}</td>
                      <td style={{ color:'var(--tx3)', fontSize:'0.82rem' }}>{e.cin||'—'}</td>
                      <td><span className="dayrate">{fmtN(dr)} MAD/j</span></td>
                      <td style={{ fontWeight:700, color:'var(--br8)' }}>{fmtN(dr*26)} MAD</td>
                      <td style={{ fontWeight:600, color:paidThisMonth > 0 ? 'var(--ok)' : 'var(--tx3)' }}>{fmtN(paidThisMonth)} MAD</td>
                      <td><span className={'badge '+(e.status==='actif'?'bg':'bo')}>{e.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'var(--be1)' }}>
                  <td colSpan="5" style={{ fontWeight:700 }}>TOTAL MASSE SALARIALE</td>
                  <td style={{ fontWeight:700, color:'var(--br9)', fontSize:'1.05rem' }}>{fmtN(actifs.reduce((a,e)=>a+getTotalPaidThisMonth(e),0))} MAD</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Calendrier paiements ── */}
      {tab==='calendrier' && (
        <div>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
            <label style={{ fontWeight:600, color:'var(--br7)', fontSize:'0.85rem' }}>👤 Employé :</label>
            <select value={calEmp||''} onChange={e=>setCalEmp(parseInt(e.target.value)||null)}
              style={{ padding:'8px 12px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem', background:'white', minWidth:200 }}>
              <option value="">— Choisir un employé —</option>
              {data.employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input type="month" value={calMois} onChange={e=>setCalMois(e.target.value)}
              style={{ padding:'8px 12px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem', background:'white' }}/>
          </div>

          {calEmp && (() => {
            const emp  = data.employees.find(e=>e.id===calEmp);
            const days = getDaysInMonth(calMois);
            const pays = emp.payments||{};
            const totalPaye = Object.entries(pays)
              .filter(([d])=>d.startsWith(calMois))
              .reduce((a,[,v])=>a+v,0);
            return (
              <div>
                <div style={{ background:'var(--be1)', borderRadius:12, padding:'1rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--br8)' }}>{emp.name} — {calMois}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--tx3)' }}>Taux : {fmtN(emp.dailyRate||0)} MAD/j</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>Total payé ce mois</div>
                    <div style={{ fontWeight:700, fontSize:'1.3rem', color:'var(--ok)' }}>{fmtN(totalPaye)} MAD</div>
                  </div>
                </div>

                {/* Grille calendrier */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:'1.5rem' }}>
                  {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>(
                    <div key={d} style={{ textAlign:'center', fontSize:'0.72rem', fontWeight:700, color:'var(--tx3)', padding:'4px', textTransform:'uppercase' }}>{d}</div>
                  ))}
                  {Array.from({length:days},(_,i)=>{
                    const dayNum = i+1;
                    const key    = `${calMois}-${String(dayNum).padStart(2,'0')}`;
                    const montant= pays[key]||0;
                    return (
                      <div key={dayNum}
                        onClick={()=>setDayAmt({day:dayNum,amount:montant?String(montant):''})}
                        style={{
                          textAlign:'center', padding:'8px 4px', borderRadius:8, cursor:'pointer',
                          background: montant>0?'var(--ok-bg,#E8F5E9)':'var(--be0)',
                          border: dayAmt.day===dayNum?'2px solid var(--br6)':'1.5px solid var(--bdr)',
                          transition:'all 0.15s'
                        }}>
                        <div style={{ fontWeight:600, fontSize:'0.85rem', color: montant>0?'var(--ok)':'var(--tx)' }}>{dayNum}</div>
                        {montant>0&&<div style={{ fontSize:'0.65rem', color:'var(--ok)', fontWeight:700 }}>{fmtN(montant)}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Saisie du montant pour le jour sélectionné */}
                {dayAmt.day && (
                  <div style={{ background:'white', borderRadius:12, padding:'1.2rem', border:'1px solid var(--bdr)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:600, color:'var(--br7)' }}>📅 Jour {dayAmt.day}/{calMois.slice(5)} :</span>
                    <input type="number" autoFocus value={dayAmt.amount} onChange={e=>setDayAmt(d=>({...d,amount:e.target.value}))} min="0"
                      placeholder="Montant MAD"
                      style={{ padding:'8px 12px', border:'1.5px solid var(--bdr)', borderRadius:8, fontSize:'0.9rem', width:140 }}/>
                    <button className="btn btn-p" onClick={saveDayPay}>💾 Enregistrer + ajouter aux charges</button>
                    <button className="btn btn-sm btn-s" onClick={()=>setDayAmt({day:'',amount:''})}>Annuler</button>
                  </div>
                )}
              </div>
            );
          })()}

          {!calEmp && <div className="empty"><span className="ei">👤</span>Sélectionnez un employé pour voir son calendrier</div>}
        </div>
      )}

      {/* Panel formulaire employé */}
      {showP && (
        <Panel title={edit?'✏️ Modifier employé':'👤 Nouvel employé'} onClose={()=>setShowP(false)}
          footer={<><button className="btn btn-s" onClick={()=>setShowP(false)}>Annuler</button><button className="btn btn-p" onClick={save}>💾 Enregistrer</button></>}>
          <div className="fg">
            <div className="fgp" style={{ gridColumn:'span 2' }}><label>👤 Nom complet *</label><input autoFocus value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="fgp">
              <label>💼 Poste *</label>
              <input list="postes-l" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="Ex: Pâtissier..."/>
              <datalist id="postes-l">{POSTES.map(p=><option key={p} value={p}/>)}</datalist>
            </div>
            <div className="fgp"><label>📅 Salaire / Jour (MAD) *</label><input type="number" value={form.dailyRate} onChange={e=>setForm(f=>({...f,dailyRate:e.target.value}))} min="0" placeholder="Ex: 150"/></div>
            <div className="fgp"><label>📞 Téléphone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06XXXXXXXX"/></div>
            <div className="fgp"><label>🪪 Carte d'identité (CIN)</label><input value={form.cin} onChange={e=>setForm(f=>({...f,cin:e.target.value}))} placeholder="AB123456"/></div>
            <div className="fgp"><label>📅 Date d'embauche</label><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></div>
            <div className="fgp">
              <label>🏷️ Statut</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="actif">✅ Actif</option>
                <option value="congé">🏖️ En congé</option>
                <option value="inactif">❌ Inactif</option>
              </select>
            </div>
          </div>
          {form.dailyRate && (
            <div className="al al-ok">
              💰 Salaire estimé/mois (26j) : <strong>{fmtN(parseFloat(form.dailyRate)*26)} MAD</strong>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
