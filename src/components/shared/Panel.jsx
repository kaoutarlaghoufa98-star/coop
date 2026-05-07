// ════════════════════════════════════════════════
// COOP TAFERNOUT — Composant Panel latéral
//
// Composant générique de fenêtre modale utilisée par plusieurs pages.
// Il propose un en-tête, un corps et un pied de page optionnel.
// ════════════════════════════════════════════════

function Panel({ title, onClose, children, footer, wide }) {
  return (
    <div className="panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={'panel' + (wide ? ' wide' : '')}>
        <div className="panel-header">
          <h2>{title}</h2>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Panel aperçu facture avec impression ──
function PrintPanel({ sale, onClose, logo }) {
  return (
    <div className="panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="panel" style={{ width: 620 }}>
        <div className="panel-header">
          <h2>🖨️ Aperçu Facture #{String(sale.id).padStart(6, '0').slice(-6)}</h2>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <div className="pprev">
            <div style={{ textAlign:'center', paddingBottom:'1.5rem', borderBottom:'2px solid var(--bdr)', marginBottom:'1.5rem' }}>
              {logo && logo.length > 10
                ? <img src={logo} style={{ width:60, height:60, borderRadius:10, objectFit:'cover', marginBottom:8 }} alt="logo"/>
                : <span style={{ fontSize:48 }}>🥐</span>}
              <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--br9)' }}>Coop Tafernout ERP</div>
              <div style={{ fontSize:'0.8rem', color:'var(--tx3)' }}>Pâtisserie Coopérative — Marrakech</div>
              <div style={{ fontWeight:600, color:'var(--br7)', marginTop:4 }}>
                Facture #{String(sale.id).padStart(6, '0').slice(-6)} — {sale.date}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.88rem', marginBottom:'1rem' }}>
              <div><strong>Client :</strong> {sale.client}</div>
              <div><strong>Date :</strong> {sale.date}</div>
              <div><strong>Statut :</strong> <span className={'badge ' + (sale.status === 'payé' ? 'bg' : 'bo')}>{sale.status}</span></div>
            </div>
            <table>
              <thead>
                <tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr>
              </thead>
              <tbody>
                {sale.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.name}</td>
                    <td>{i.qty}</td>
                    <td>{i.price.toFixed(2)} MAD</td>
                    <td style={{ fontWeight:600 }}>{(i.qty * i.price).toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="tr">
                  <td colSpan="3"><strong>TOTAL</strong></td>
                  <td><strong>{sale.total.toFixed(2)} MAD</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="panel-footer">
          <button className="btn btn-s" onClick={onClose}>Fermer</button>
          <button className="btn btn-p" onClick={() => doPrint(buildInvHTML(sale, logo))}>🖨️ Imprimer</button>
        </div>
      </div>
    </div>
  );
}
