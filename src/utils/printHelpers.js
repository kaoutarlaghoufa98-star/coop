// ════════════════════════════════════════════════
// COOP TAFERNOUT — Helpers d'impression
// ════════════════════════════════════════════════

// ── Génère le HTML d'une facture de vente ──
function buildInvHTML(sale, logo) {
  const n = '#' + String(sale.id).padStart(6, '0').slice(-6);
  return `<html><head><title>Facture ${n}</title>
  <style>
    body{font-family:Georgia,serif;padding:2rem;color:#1A0E08;max-width:680px;margin:0 auto}
    .hd{text-align:center;padding-bottom:1.5rem;border-bottom:2px solid #E8C9A8;margin-bottom:1.5rem}
    h1{font-size:1.4rem;text-transform:uppercase;letter-spacing:2px}
    p.s{font-size:0.8rem;color:#9B7B6A}
    table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.9rem}
    th,td{padding:9px 12px;text-align:left;border-bottom:1px solid #E8C9A8}
    th{background:#FBF6F1;font-size:0.72rem;text-transform:uppercase;color:#9B7B6A}
    .tr td{font-weight:700;font-size:1.05rem;border-top:2px solid #5C3317}
    .ft{margin-top:2rem;text-align:center;font-size:0.75rem;color:#9B7B6A;border-top:1px solid #E8C9A8;padding-top:1rem}
    @media print{body{padding:1rem}}
  </style></head><body>
  <div class="hd">
    ${logo && logo.length > 10 ? `<img src="${logo}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;margin-bottom:8px" alt="logo"/>` : '<div style="font-size:48px">🥐</div>'}
    <h1>Coop Tafernout</h1>
    <p class="s">Pâtisserie Coopérative — Marrakech</p>
    <p class="s" style="font-weight:600;margin-top:6px">Facture ${n}</p>
  </div>
  <p><strong>Client :</strong> ${sale.client}</p>
  <p><strong>Date :</strong> ${sale.date}</p>
  <p><strong>Statut :</strong> ${sale.status}</p>
  <table>
    <thead><tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
    <tbody>${sale.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)} MAD</td><td>${(i.qty * i.price).toFixed(2)} MAD</td></tr>`).join('')}</tbody>
    <tfoot><tr class="tr"><td colspan="3"><strong>TOTAL</strong></td><td><strong>${sale.total.toFixed(2)} MAD</strong></td></tr></tfoot>
  </table>
  <div class="ft">🎂 Merci pour votre confiance — Coop Tafernout</div>
  </body></html>`;
}

// ── Génère le HTML d'un bon de commande ──
function buildCmdHTML(cmd, logo) {
  return `<html><head><title>${cmd.num}</title>
  <style>
    body{font-family:Georgia,serif;padding:2rem;color:#1A0E08;max-width:680px;margin:0 auto}
    .hd{text-align:center;padding-bottom:1.5rem;border-bottom:2px solid #E8C9A8;margin-bottom:1.5rem}
    h1{font-size:1.4rem;text-transform:uppercase;letter-spacing:2px}
    p.s{font-size:0.8rem;color:#9B7B6A}
    table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.9rem}
    th,td{padding:9px 12px;text-align:left;border-bottom:1px solid #E8C9A8}
    th{background:#FBF6F1;font-size:0.72rem;text-transform:uppercase;color:#9B7B6A}
    .tr td{font-weight:700;font-size:1.05rem;border-top:2px solid #5C3317}
    .ft{margin-top:2rem;text-align:center;font-size:0.75rem;color:#9B7B6A;border-top:1px solid #E8C9A8;padding-top:1rem}
  </style></head><body>
  <div class="hd">
    ${logo && logo.length > 10 ? `<img src="${logo}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;margin-bottom:8px" alt="logo"/>` : '<div style="font-size:48px">🥐</div>'}
    <h1>Bon de Commande</h1>
    <p class="s">Coop Tafernout — ${cmd.num}</p>
  </div>
  <p><strong>Client :</strong> ${cmd.client} — ${cmd.phone}</p>
  <p><strong>Date commande :</strong> ${cmd.date}</p>
  <p><strong>Livraison :</strong> ${cmd.livraison}</p>
  <p><strong>Notes :</strong> ${cmd.notes || '—'}</p>
  <table>
    <thead><tr><th>Produit</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead>
    <tbody>${cmd.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)} MAD</td><td>${(i.qty * i.price).toFixed(2)} MAD</td></tr>`).join('')}</tbody>
    <tfoot><tr class="tr"><td colspan="3"><strong>TOTAL</strong></td><td><strong>${cmd.total.toFixed(2)} MAD</strong></td></tr></tfoot>
  </table>
  <div class="ft">Coop Tafernout — Merci pour votre commande</div>
  </body></html>`;
}

// ── Ouvre une fenêtre d'impression ──
function doPrint(html) {
  const w = window.open('', '_blank', 'width=720,height=900');
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}
