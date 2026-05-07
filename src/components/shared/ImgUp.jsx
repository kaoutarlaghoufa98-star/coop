// ════════════════════════════════════════════════
// COOP TAFERNOUT — Composant upload d'image
//
// Petit composant réutilisable pour charger une image et la convertir
// en data URL. Utile pour stocker des images directement dans les données JSON.
// ════════════════════════════════════════════════

function ImgUp({ value, onChange, label }) {
  const h = e => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => onChange(ev.target.result);
    r.readAsDataURL(f);
  };
  return (
    <div className="fgp" style={{ gridColumn: 'span 2' }}>
      <label>{label || '📷 Photo du produit'}</label>
      <div className="imgup">
        <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={h} />
        {value && value.length > 10
          ? <img src={value} className="imgup-prev" alt="preview" />
          : <div style={{ color:'var(--tx3)', fontSize:'0.85rem', padding:'1rem 0' }}>
              📷 Cliquez pour choisir une photo (PNG/JPG)
            </div>
        }
      </div>
    </div>
  );
}
