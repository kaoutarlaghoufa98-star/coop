// ════════════════════════════════════════════════
// COOP TAFERNOUT — Factures
//
// Affiche les ventes déjà enregistrées sous forme de factures.
// On peut ouvrir un aperçu et imprimer la facture via le composant PrintPanel.
// ════════════════════════════════════════════════

const { useState: useStateInvoices } = React;

function Invoices({ data, appLogo }) {
  const [ps, setPs] = useStateInvoices(null);
  return (
    <div className="page-body">
      {ps && <PrintPanel sale={ps} onClose={() => setPs(null)} logo={appLogo} />}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.5rem' }}>
        <div className="sc b"><div className="sl">🧾 Total</div><div className="sv">{data.sales.length}</div></div>
        <div className="sc g"><div className="sl">✅ Payées</div><div className="sv">{data.sales.filter(s => s.status === 'payé').length}</div></div>
        <div className="sc o"><div className="sl">⏳ Créances</div><div className="sv">{data.sales.filter(s => s.status === 'créance').length}</div></div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>N°</th><th>📅 Date</th><th>👤 Client</th><th>Détail</th><th>💰 Total</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {data.sales.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily:'monospace', color:'var(--br7)', fontWeight:600 }}>#{String(s.id).padStart(6,'0').slice(-6)}</td>
                  <td style={{ color:'var(--tx3)' }}>{s.date}</td>
                  <td><strong>{s.client}</strong></td>
                  <td style={{ fontSize:'0.78rem', color:'var(--tx3)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.items.map(i => i.name + '×' + i.qty).join(', ')}
                  </td>
                  <td style={{ fontWeight:700, color:'var(--br8)' }}>{fmt(s.total)}</td>
                  <td><span className={'badge ' + (s.status === 'payé' ? 'bg' : 'bo')}>{s.status}</span></td>
                  <td><button className="btn btn-sm btn-p" onClick={() => setPs(s)}>🖨️ Imprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
