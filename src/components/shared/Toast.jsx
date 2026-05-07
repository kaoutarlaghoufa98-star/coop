// ════════════════════════════════════════════════
// COOP TAFERNOUT — Composant Toast (notification)
//
// Affiche une notification temporaire à l'écran.
// Elle se ferme automatiquement au bout de quelques secondes.
// ════════════════════════════════════════════════

const { useEffect } = React;

function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  return <div className="toast">{msg}</div>;
}
