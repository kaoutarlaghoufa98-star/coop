// ════════════════════════════════════════════════
// COOP TAFERNOUT — Paramètres
// Thème couleurs personnalisé · sans identité boutique
//
// Cette page propose les paramètres d'apparence, le logo et les sauvegardes.
// Elle permet d'appliquer un thème, de modifier les couleurs, et d'exporter/importer
// toutes les données de l'application au format JSON.
// ════════════════════════════════════════════════

const { useState: useStateParam } = React;

const THEMES = [
  { key:'',       label:'🍫 Marron (défaut)', color:'#5C3317' },
  { key:'vert',   label:'🌿 Vert',            color:'#2E7D32' },
  { key:'bleu',   label:'🌊 Bleu',            color:'#1565C0' },
  { key:'violet', label:'💜 Violet',          color:'#6A1B9A' },
  { key:'sombre', label:'🌙 Mode sombre',     color:'#1A1210' },
];

const COLOR_VARS = [
  { key:'--br7',  label:'Couleur principale',  type:'color' },
  { key:'--gold', label:'Couleur accent (or)', type:'color' },
  { key:'--be0',  label:'Fond de page',        type:'color' },
  { key:'--tx',   label:'Couleur texte',        type:'color' },
  { key:'--bdr',  label:'Couleur bordure',      type:'color' },
];

function Parametres({ data, updateData }) {
  const s = data.appSettings || {};
  const [toast,      setToast]     = useStateParam(null);
  const [customColors,setCustom]   = useStateParam(s.customColors || {});
  const [showColors, setShowColors]= useStateParam(false);
  const [loading,    setLoading]   = useStateParam(false);

  const upS = (k, v) => updateData('appSettings', { ...s, [k]: v });

  const applyTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    upS('theme', theme);
    setToast('✅ Thème appliqué');
  };

  const applyColor = (varName, val) => {
    document.documentElement.style.setProperty(varName, val);
    const next = { ...customColors, [varName]: val };
    setCustom(next);
    upS('customColors', next);
  };

  const resetColors = () => {
    COLOR_VARS.forEach(c => document.documentElement.style.removeProperty(c.key));
    setCustom({});
    upS('customColors', {});
    setToast('✅ Couleurs réinitialisées');
  };

  const handleLogo = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { upS('logo', ev.target.result); setToast('✅ Logo mis à jour'); };
    r.readAsDataURL(f);
  };

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tafernout_backup_' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
      setToast('✅ Données exportées');
    } catch (error) {
      console.error('Export error:', error);
      setToast('❌ Erreur lors de l\'export : ' + error.message);
    }
  };

  const importData = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (window.confirm('⚠️ Remplacer TOUTES les données actuelles ?')) {
          Object.keys(parsed).forEach(k => updateData(k, parsed[k]));
          setToast('✅ Données importées');
        }
      } catch { alert('Fichier invalide'); }
    };
    r.readAsText(f);
  };

  // Fonction pour exécuter un script Python
  const runPythonScript = async (scriptName, description) => {
    setLoading(true);
    setToast(`🔄 Génération du ${description}...`);

    try {
      // Utilise l'API Electron pour exécuter le script Python
      const result = await window.electronAPI.runPython(scriptName);

      if (result.success) {
        let toastMsg = `✅ ${description} généré avec succès !`;
        // Ouvrir le fichier généré dans le navigateur par défaut
        if (result.outputFile) {
          const openResult = await window.electronAPI.openFile(result.outputFile);
          if (!openResult?.success) {
            toastMsg = `⚠️ ${description} généré, mais ouverture impossible : ${openResult?.error || 'erreur inconnue'}`;
          }
        }
        setToast(toastMsg);
      } else {
        setToast(`❌ Erreur : ${result.error}`);
      }
    } catch (error) {
      setToast(`❌ Erreur lors de l'exécution : ${error.message}`);
    }

    setLoading(false);
  };

  const totV = data.sales.reduce((a, s) => a + s.total, 0);
  const totC = data.charges.reduce((a, c) => a + c.amount, 0);

  return (
    <div className="page-body">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* ── Logo ── */}
        <div className="card">
          <div className="stitle">🖼️ Logo de l'application</div>
          <div className="fgp">
            <div className="logoup">
              <input type="file" accept="image/*" onChange={handleLogo} />
              {s.logo && s.logo.length > 10
                ? <img src={s.logo} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', display: 'block', margin: '0 auto' }} alt="logo" />
                : <div style={{ padding: '1.5rem', color: 'var(--tx3)', fontSize: '0.85rem' }}>📷 Cliquez pour ajouter un logo</div>
              }
            </div>
            {s.logo && s.logo.length > 10 && (
              <button className="btn btn-sm btn-d" style={{ marginTop: 6 }} onClick={() => upS('logo', '')}>🗑️ Supprimer le logo</button>
            )}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--tx3)', textAlign: 'center', fontStyle: 'italic' }}>
            By PatisPredict
          </div>
        </div>

        {/* ── Thème prédéfini ── */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="stitle">🎨 Thème de couleur</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEMES.map(t => (
                <button key={t.key}
                  className={'btn ' + ((s.theme || '') === t.key ? 'btn-p' : 'btn-s')}
                  style={{ justifyContent: 'flex-start', borderLeft: '4px solid ' + t.color }}
                  onClick={() => applyTheme(t.key)}>
                  {t.label} {(s.theme || '') === t.key && '✓ Actif'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Palette personnalisée ── */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="stitle" style={{ marginBottom: 0 }}>🖌️ Palette personnalisée</div>
              <button className="btn btn-sm btn-s" onClick={() => setShowColors(!showColors)}>
                {showColors ? 'Masquer' : 'Personnaliser'}
              </button>
            </div>
            {showColors && (
              <div>
                {COLOR_VARS.map(cv => (
                  <div key={cv.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bdr)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--tx2)' }}>{cv.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="color"
                        value={customColors[cv.key] || '#5C3317'}
                        onChange={e => applyColor(cv.key, e.target.value)}
                        style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontFamily: 'monospace' }}>{customColors[cv.key] || 'défaut'}</span>
                    </div>
                  </div>
                ))}
                <button className="btn btn-sm btn-s" style={{ marginTop: 10 }} onClick={resetColors}>
                  🔄 Réinitialiser les couleurs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sauvegarde ── */}
        <div className="card">
          <div className="stitle">💾 Sauvegarde des données</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-p" onClick={exportData} style={{ justifyContent: 'center' }}>
              📥 Exporter les données (JSON)
            </button>
            <label className="btn btn-s" style={{ justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              📤 Importer une sauvegarde
              <input type="file" accept=".json" onChange={importData} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            </label>
            <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginTop: 4 }}>
              ⚠️ L'import remplace toutes les données actuelles.
            </div>
          </div>
        </div>

        {/* ── Rapports ── */}
        <div className="card">
          <div className="stitle">📊 Génération de rapports</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, color: 'var(--br8)' }}>
                📈 Rapport Financier Mensuel
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: 8 }}>
                Rapport complet avec indicateurs clés, ventes par catégorie, charges, bénéfices et liste des débiteurs.
              </div>
              <button
                className="btn btn-p"
                disabled={loading}
                onClick={() => runPythonScript('rapport_financier.py', 'rapport financier')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? '🔄 Génération...' : '📊 Générer Rapport Financier'}
              </button>
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6, color: 'var(--br8)' }}>
                📦 Alertes Stock & Suggestions
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: 8 }}>
                Rapport détaillé sur les produits en rupture, en alerte, et suggestions d'optimisation des stocks.
              </div>
              <button
                className="btn btn-p"
                disabled={loading}
                onClick={() => runPythonScript('alertes_stock.py', 'rapport d\'alertes stock')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? '🔄 Génération...' : '📦 Générer Alertes Stock'}
              </button>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--tx3)', marginTop: 6, paddingTop: 8, borderTop: '1px solid var(--bdr)' }}>
              💡 Les rapports utilisent les données actuelles de l'application et s'ouvrent automatiquement dans votre navigateur.
            </div>
          </div>
        </div>

        {/* ── Résumé général ── */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="stitle">📊 Résumé général</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { icon:'🎂', val:data.products.length,  label:'Produits'       },
              { icon:'👥', val:data.clients.length,   label:'Clients'        },
              { icon:'💰', val:fmtN(totV)+' MAD',    label:'Ventes totales', color:'var(--ok)' },
              { icon:'📉', val:fmtN(totC)+' MAD',    label:'Charges totales',color:'var(--ng)' },
            ].map((it,i) => (
              <div key={i} style={{ textAlign:'center', padding:'1rem', background:'var(--be0)', borderRadius:10 }}>
                <div style={{ fontSize:'1.8rem', marginBottom:4 }}>{it.icon}</div>
                <div style={{ fontSize:'1.2rem', fontWeight:700, color:it.color||'var(--br8)' }}>{it.val}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--tx3)' }}>{it.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
