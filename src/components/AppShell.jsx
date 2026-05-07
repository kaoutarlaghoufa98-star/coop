// ════════════════════════════════════════════════
// COOP TAFERNOUT — Shell principal
// Fix : bug clavier · logo aligné · offline
//
// Ce composant est le shell principal après connexion.
// Il affiche la barre de navigation à gauche, gère la page active,
// applique le thème et transmet les données aux pages internes.
// Les pages (Dashboard, POS, Produits, etc.) reçoivent les données et
// la fonction updateData pour persister les modifications.
// ════════════════════════════════════════════════

const { useState: useStateShell, useEffect: useEffectShell } = React;

const NAV = [
  { section: 'Principal' },
  { key:'dashboard',  label:'Tableau de bord',   icon:'📊' },
  { key:'pos',        label:'Point de Vente',     icon:'🛒' },
  { section: 'Gestion' },
  { key:'products',   label:'Produits',           icon:'🎂' },
  { key:'clients',    label:'Clients & Créances', icon:'👥' },
  { key:'commandes',  label:'Commandes',          icon:'📋' },
  { key:'invoices',   label:'Factures',           icon:'🧾' },
  { section: 'Stocks & Finances' },
  { key:'stock',      label:'Stock Matières',     icon:'📦' },
  { key:'charges',    label:'Charges & Pertes',   icon:'💸' },
  { section: 'Administration' },
  { key:'personnel',  label:'Personnel',          icon:'👤' },
  { key:'users',      label:'Utilisateurs',       icon:'🔑' },
  { key:'parametres', label:'Paramètres',         icon:'⚙️' },
];

const PAGE_TITLES = {
  dashboard:'📊 Tableau de bord', pos:'🛒 Point de Vente',
  products:'🎂 Catalogue Produits', clients:'👥 Clients & Créances',
  stock:'📦 Stock Matières', charges:'💸 Charges & Pertes',
  invoices:'🧾 Factures', personnel:'👤 Personnel',
  commandes:'📋 Commandes', users:'🔑 Utilisateurs', parametres:'⚙️ Paramètres',
};

function AppShell({ initUser }) {
  const [data, update] = useStore();
  const [page, setPage] = useStateShell('dashboard');
  const [user, setUser] = useStateShell(initUser);

  // Applique le thème + couleurs personnalisées au montage
  useEffectShell(() => {
    const s = data.appSettings || {};
    if (s.theme) document.documentElement.setAttribute('data-theme', s.theme);
    // Réapplique les couleurs custom après navigation/reload
    if (s.customColors) {
      Object.entries(s.customColors).forEach(([k,v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    }
  }, []);

  // Fix clavier : blur l'élément actif quand on change de page (sauf les inputs)
  const goPage = (key) => {
    if (document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      document.activeElement.blur();
    }
    setPage(key);
  };

  const canAccess = key => !user?.permissions || user.permissions[key] !== false;
  const navItems  = NAV.filter(item => !item.key || canAccess(item.key));

  const s            = data.appSettings || {};
  const logo         = s.logo || '';
  const appName      = s.name || 'Coop Tafernout ERP';
  const stockAlerts  = (data.rawMaterials || []).filter(m => m.currentStock <= m.minStock).length;
  const creditAlerts = data.clients.filter(c => c.credit > 0).length;

  const logout = () => { setUser(null); window.location.reload(); };

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {logo && logo.length > 10
            ? <img src={logo} className="sidebar-logo-img" alt="logo" />
            : <span className="sidebar-logo-emoji">🥐</span>}
          <h2>{appName}</h2>
          <p>{s.ville || 'Marrakech'}</p>
        </div>

        <nav style={{ flex:1, overflowY:'auto', paddingBottom:'1rem' }}>
          {navItems.map((item, i) => {
            if (item.section) return <div key={i} className="nav-section">{item.section}</div>;
            const badge = item.key==='stock'   && stockAlerts  ? stockAlerts
                        : item.key==='clients' && creditAlerts ? creditAlerts
                        : null;
            return (
              <div key={item.key}
                className={'nav-item' + (page===item.key?' active':'')}
                onClick={() => goPage(item.key)}>
                <span className="ni">{item.icon}</span>
                <span className="nl">{item.label}</span>
                {badge && (
                  <span style={{ background:'rgba(255,80,80,0.85)', color:'white', borderRadius:999,
                                  fontSize:'0.65rem', fontWeight:700, padding:'1px 7px', marginLeft:'auto' }}>
                    {badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize:'0.75rem', color:'var(--br5)', marginBottom:8 }}>
            👤 <strong>{user?.name}</strong><br/>
            <span style={{ fontSize:'0.7rem' }}>{user?.role}</span>
          </div>
          <button className="logout-btn" onClick={logout}>🚪 Déconnexion</button>
          <p style={{ textAlign:'center', marginTop:8, fontSize:'0.6rem', color:'var(--br5)', opacity:0.6 }}>By PatisPredict</p>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="main-content">
        <div className="page-header">
          <h1>{PAGE_TITLES[page] || page}</h1>
          <div style={{ fontSize:'0.8rem', color:'var(--tx3)' }}>
            📅 {new Date().toLocaleDateString('fr-MA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
        </div>

        {page==='dashboard'  && <Dashboard  data={data} />}
        {page==='pos'        && <POS         data={data} updateData={update} appLogo={logo} />}
        {page==='products'   && <Products    data={data} updateData={update} />}
        {page==='clients'    && <Clients     data={data} updateData={update} />}
        {page==='commandes'  && <Commandes   data={data} updateData={update} appLogo={logo} />}
        {page==='stock'      && <Stock       data={data} updateData={update} />}
        {page==='charges'    && <Charges     data={data} updateData={update} />}
        {page==='invoices'   && <Invoices    data={data} appLogo={logo} />}
        {page==='personnel'  && <Personnel   data={data} updateData={update} />}
        {page==='users'      && <Users       data={data} updateData={update} currentUser={user} />}
        {page==='parametres' && <Parametres  data={data} updateData={update} />}
      </main>
    </div>
  );
}
