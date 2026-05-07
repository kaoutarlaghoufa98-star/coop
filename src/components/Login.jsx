// ════════════════════════════════════════════════
// COOP TAFERNOUT — Page de connexion
// Fix : écran blanc après ajout utilisateur
//
// Cette page affiche le formulaire de connexion.
// Elle reçoit la liste des utilisateurs (users) et le logo de l'application.
// Après validation des identifiants, elle charge le composant AppShell
// qui gère ensuite l'ensemble des pages de l'application.
// ════════════════════════════════════════════════

const { useState: useStateLogin } = React;

function LoginPage({ users, logo, appName }) {
  const [u,      setU]   = useStateLogin('');
  const [p,      setP]   = useStateLogin('');
  const [err,    setErr] = useStateLogin('');
  const [logged, setLog] = useStateLogin(null);

  const login = () => {
    const list = Array.isArray(users) ? users : [];
    const usr  = list.find(x => x.username === u && x.password === p);
    if (usr) { setErr(''); setLog(usr); }
    else { setErr('Identifiants incorrects.'); }
  };

  // Fix bug écran blanc : si logged est défini, render AppShell
  if (logged) return <AppShell initUser={logged} />;

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          {logo && logo.length > 10
            ? <img src={logo} className="login-logo-img" alt="logo" />
            : <span className="login-logo-emoji">🥐</span>}
          <h1>{appName || 'Coop Tafernout ERP'}</h1>
          <p>Système de Gestion — Pâtisserie Coopérative</p>
        </div>
        {err && <div className="login-error">⚠ {err}</div>}
        <div className="login-field">
          <label>Identifiant</label>
          <input value={u} onChange={e => { setU(e.target.value); setErr(''); }}
            onKeyDown={e => e.key==='Enter' && login()} autoFocus />
        </div>
        <div className="login-field">
          <label>Mot de passe</label>
          <input type="password" value={p}
            onChange={e => { setP(e.target.value); setErr(''); }}
            onKeyDown={e => e.key==='Enter' && login()} />
        </div>
        <button className="login-btn" onClick={login}>🚀 Se connecter</button>
        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.72rem', color:'var(--tx3)' }}>
          By PatisPredict
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
